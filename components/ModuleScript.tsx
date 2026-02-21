"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookmarkCheck, Highlighter, Languages } from "lucide-react";
import type { TranscriptLine } from "@/data/types";
import type { ThemeConfig } from "@/lib/theme-config";
import { toggleNotebook, getNotebookByLesson } from "@/lib/notebook-store";
import { toggleWordHighlight, getHighlightsByLesson } from "@/lib/word-highlight-store";

interface ModuleScriptProps {
  currentTime: number;
  isPlaying: boolean;
  theme: ThemeConfig;
  onSeek: (t: number) => void;
  setIsPlaying: (p: boolean) => void;
  transcript: TranscriptLine[];
  lessonId: string;
  category?: string;
}

type LangMode = 'en' | 'cn' | 'bi';

// 虚拟滚动常量
const ITEM_HEIGHT = 70;      // 每行预估高度（px）
const OVERSCAN_COUNT = 5;     // 上下额外渲染的行数

export default function ModuleScript({ currentTime, isPlaying, theme, onSeek, setIsPlaying, transcript, lessonId, category }: ModuleScriptProps) {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [langMode, setLangMode] = useState<LangMode>('bi');
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);
  const [highlightedWords, setHighlightedWords] = useState<Set<string>>(new Set());
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const wordLongPressTimer = useRef<NodeJS.Timeout | null>(null);
  const [pressingLineId, setPressingLineId] = useState<number | null>(null);
  const [pressProgress, setPressProgress] = useState(0);
  const [pressingWord, setPressingWord] = useState<string | null>(null);
  const [wordPressProgress, setWordPressProgress] = useState(0);
  const [justSavedId, setJustSavedId] = useState<number | null>(null); // 刚收藏成功的句子ID

  // 是否使用虚拟滚动（仅当行数 > 50 时启用）
  const useVirtualScroll = transcript.length > 50;

  // 初始化：从 localStorage 读取已收藏的句子和标亮的词汇
  useEffect(() => {
    const items = getNotebookByLesson(lessonId);
    const ids = new Set(
      items.filter(i => i.type === 'sentence').map(i => i.id)
    );
    setSavedIds(ids);

    const highlights = getHighlightsByLesson(lessonId);
    const wordIds = new Set(highlights.map(h => h.id));
    setHighlightedWords(wordIds);
  }, [lessonId]);

  // 监测容器高度
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // 虚拟滚动计算
  const { visibleItems, totalHeight, offsetY } = useMemo(() => {
    if (!useVirtualScroll) {
      return {
        visibleItems: transcript.map((line, i) => ({ line, index: i })),
        totalHeight: 0,
        offsetY: 0,
      };
    }

    const total = transcript.length * ITEM_HEIGHT;
    const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN_COUNT);
    const endIndex = Math.min(
      transcript.length - 1,
      Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + OVERSCAN_COUNT
    );

    const visible = [];
    for (let i = startIndex; i <= endIndex; i++) {
      visible.push({ line: transcript[i], index: i });
    }

    return {
      visibleItems: visible,
      totalHeight: total,
      offsetY: startIndex * ITEM_HEIGHT,
    };
  }, [transcript, scrollTop, containerHeight, useVirtualScroll]);

  // 滚动事件（虚拟滚动）
  const handleScroll = useCallback(() => {
    if (scrollContainerRef.current && useVirtualScroll) {
      setScrollTop(scrollContainerRef.current.scrollTop);
    }
  }, [useVirtualScroll]);

  // 自动滚动到当前活跃行（优化：减少不必要的滚动）
  const lastScrolledIndex = useRef<number>(-1);
  
  useEffect(() => {
    if (!isPlaying || !scrollContainerRef.current) return;

    const activeIndex = transcript.findIndex(
      (line) => currentTime >= line.start && currentTime <= line.end
    );
    if (activeIndex < 0) return;

    // 只在切换到新行时才滚动，避免同一行内频繁触发
    if (activeIndex === lastScrolledIndex.current) return;
    lastScrolledIndex.current = activeIndex;

    if (useVirtualScroll) {
      const targetScrollTop = activeIndex * ITEM_HEIGHT - containerHeight / 2 + ITEM_HEIGHT / 2;
      const currentScrollTop = scrollContainerRef.current.scrollTop;
      
      // 只有当目标位置与当前位置差距较大时才滚动（避免微小抖动）
      if (Math.abs(targetScrollTop - currentScrollTop) > ITEM_HEIGHT / 2) {
        scrollContainerRef.current.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
      }
    } else {
      // 非虚拟滚动时，使用 DOM 查询
      const el = scrollContainerRef.current.querySelector(`[data-line-id="${activeIndex}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentTime, isPlaying, transcript, useVirtualScroll, containerHeight]);

  // 获取填充颜色（根据主题）
  const getFillColor = () => {
    switch (theme.id) {
      case 'daily':
        return '#1A2233'; // midnight blue
      case 'cognitive':
        return '#2D0F15'; // plum wine
      case 'business':
        return '#E8D5D8'; // 浅灰粉
      default:
        return theme.accent;
    }
  };

  const handleToggleSave = (line: TranscriptLine) => {
    const itemId = `${lessonId}-script-${line.id}`;
    const isNowSaved = toggleNotebook({
      id: itemId,
      lessonId,
      category,
      type: 'sentence',
      content: line.en,
      sub: line.cn,
      timestamp: line.start,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
    });
    setSavedIds(prev => {
      const next = new Set(prev);
      if (isNowSaved) next.add(itemId);
      else next.delete(itemId);
      return next;
    });

    // 如果是收藏成功，显示成功动画
    if (isNowSaved) {
      setJustSavedId(line.id);
      setTimeout(() => setJustSavedId(null), 2000); // 2秒后隐藏
    }

    // 触发震动反馈（仅移动端）- 使用更强的震动模式
    if (typeof window !== 'undefined' && window.navigator && 'vibrate' in window.navigator) {
      try {
        // 使用震动模式：短震-停顿-短震
        window.navigator.vibrate([30, 50, 30]);
      } catch (e) {
        console.log('Vibration not supported');
      }
    }
  };

  // 开始长按（句子收藏）
  const handlePressStart = (line: TranscriptLine, e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setPressingLineId(line.id);
    setPressProgress(0);

    const startTime = Date.now();
    const duration = 2000; // 改为 2000ms (2秒)

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setPressProgress(progress);

      if (progress < 1) {
        longPressTimer.current = setTimeout(updateProgress, 16) as any;
      } else {
        handleToggleSave(line);
        setPressingLineId(null);
        setPressProgress(0);
      }
    };

    updateProgress();
  };

  // 取消长按（句子收藏）
  const handlePressCancel = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setPressingLineId(null);
    setPressProgress(0);
  };

  // 开始长按（词汇标亮）
  const handleWordPressStart = (word: string, lineId: number, e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    const wordId = `${lessonId}-${lineId}-${word}`;
    setPressingWord(wordId);
    setWordPressProgress(0);

    const startTime = Date.now();
    const duration = 500; // 0.5秒

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setWordPressProgress(progress);

      if (progress < 1) {
        wordLongPressTimer.current = setTimeout(updateProgress, 16) as any;
      } else {
        // 完成标亮
        const isNowHighlighted = toggleWordHighlight({
          id: wordId,
          lessonId,
          lineId,
          word,
        });
        setHighlightedWords(prev => {
          const next = new Set(prev);
          if (isNowHighlighted) next.add(wordId);
          else next.delete(wordId);
          return next;
        });
        setPressingWord(null);
        setWordPressProgress(0);

        // 触发震动反馈
        if (typeof window !== 'undefined' && window.navigator && 'vibrate' in window.navigator) {
          try {
            window.navigator.vibrate([20, 30, 20]);
          } catch (e) {
            console.log('Vibration not supported');
          }
        }
      }
    };

    updateProgress();
  };

  // 取消长按（词汇标亮）
  const handleWordPressCancel = () => {
    if (wordLongPressTimer.current) {
      clearTimeout(wordLongPressTimer.current);
      wordLongPressTimer.current = null;
    }
    setPressingWord(null);
    setWordPressProgress(0);
  };

  // 处理词汇点击标亮（已废弃，改为长按）
  const handleWordClick = (word: string, lineId: number, e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    // 不再使用点击，改为长按
  };

  // 将文本分割成词汇并渲染
  const renderTextWithHighlights = (text: string, lineId: number, isEnglish: boolean) => {
    if (!isEnglish) return text; // 中文不支持标亮

    const words = text.split(/(\s+|[.,!?;:])/); // 按空格和标点分割
    return words.map((word, index) => {
      if (!word.trim() || /^[.,!?;:]$/.test(word)) {
        return <span key={index}>{word}</span>;
      }

      const wordId = `${lessonId}-${lineId}-${word}`;
      const isHighlighted = highlightedWords.has(wordId);
      const isPressing = pressingWord === wordId;

      return (
        <span
          key={index}
          className="inline-block cursor-pointer select-none transition-all duration-200 hover:opacity-80 relative"
          style={{
            backgroundColor: isHighlighted ? theme.wordHighlightBg : 'transparent',
            color: isHighlighted ? theme.wordHighlightText : 'inherit',
            padding: isHighlighted ? '2px 4px' : '0',
            borderRadius: '2px',
            margin: '0 1px',
          }}
          onMouseDown={(e) => handleWordPressStart(word, lineId, e)}
          onMouseUp={handleWordPressCancel}
          onMouseLeave={handleWordPressCancel}
          onTouchStart={(e) => handleWordPressStart(word, lineId, e)}
          onTouchEnd={handleWordPressCancel}
        >
          {word}
          {/* 长按进度条 */}
          {isPressing && (
            <span
              className="absolute bottom-0 left-0 h-[2px] bg-current transition-all"
              style={{
                width: `${wordPressProgress * 100}%`,
                backgroundColor: theme.accent,
              }}
            />
          )}
        </span>
      );
    });
  };

  // 获取收藏后的样式（根据主题）
  const getSavedStyle = () => {
    switch (theme.id) {
      case 'daily':
        return {
          backgroundColor: '#1A2233', // midnight blue 底
          color: '#F7F8F9', // paper white 字
        };
      case 'cognitive':
        return {
          backgroundColor: '#2D0F15', // plum wine 底
          color: '#F7F8F9', // paper white 字
        };
      case 'business':
        return {
          backgroundColor: '#4A2C32', // 深紫红底
          color: '#E8D5D8', // 浅灰粉字
        };
      default:
        return {
          backgroundColor: theme.highlight,
          color: theme.text,
        };
    }
  };

  const renderLine = (line: TranscriptLine, index: number) => {
    const isActive = currentTime >= line.start && currentTime <= line.end;
    const itemId = `${lessonId}-script-${line.id}`;
    const isSaved = savedIds.has(itemId);
    const isPressing = pressingLineId === line.id;
    const fillColor = getFillColor();
    const isJustSaved = justSavedId === line.id;
    const savedStyle = getSavedStyle();

    return (
      <motion.div
        key={line.id}
        data-line-id={index}
        onClick={() => { onSeek(line.start); setIsPlaying(true); }}
        onMouseDown={(e) => handlePressStart(line, e)}
        onMouseUp={handlePressCancel}
        onMouseLeave={handlePressCancel}
        onTouchStart={(e) => handlePressStart(line, e)}
        onTouchEnd={handlePressCancel}
        initial={false}
        animate={{ 
          opacity: isActive ? 1 : (isSaved ? 1 : 0.25),
          scale: isPressing ? 0.98 : 1,
        }}
        transition={{ 
          opacity: { duration: 0.15, ease: "easeOut" },
          scale: { duration: 0.15, ease: "easeOut" }
        }}
        className={`relative py-2 pl-6 pr-4 transition-all duration-500 cursor-pointer group border-l-[3px] overflow-hidden
          ${isActive ? "border-current" : "border-transparent hover:border-black/5"}
        `}
        style={{
          borderColor: isActive ? theme.accent : 'transparent',
          ...(useVirtualScroll ? { height: ITEM_HEIGHT, boxSizing: 'border-box' as const } : {}),
        }}
      >
        {/* 收藏后的背景色 */}
        {isSaved && !isActive && (
          <div
            className="absolute inset-0 -z-10 rounded-r-lg transition-all duration-500"
            style={{
              backgroundColor: savedStyle.backgroundColor,
            }}
          />
        )}

        {/* 活跃状态的高亮背景 */}
        {isActive && (
          <div
            className="absolute inset-0 -z-10 rounded-r-lg transition-opacity duration-500 mix-blend-multiply"
            style={{
              backgroundColor: theme.highlight,
              opacity: 1,
            }}
          />
        )}

        {/* 墨水填充效果 */}
        {isPressing && (
          <motion.div
            className="absolute inset-0 -z-10"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: pressProgress }}
            transition={{ duration: 0, ease: 'linear' }}
            style={{
              backgroundColor: fillColor,
              opacity: 0.5,
              transformOrigin: 'left',
            }}
          />
        )}

        {/* 完成时的光晕效果 */}
        {isPressing && pressProgress >= 0.99 && (
          <motion.div
            className="absolute inset-0 -z-10 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0] }}
            transition={{ duration: 0.4 }}
            style={{
              boxShadow: `inset 0 0 20px ${fillColor}80`,
            }}
          />
        )}

        {/* 收藏成功提示 */}
        {isJustSaved && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className="absolute top-2 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full shadow-lg backdrop-blur-md z-10"
            style={{
              backgroundColor: theme.id === 'business' ? '#E8D5D8' : (theme.id === 'daily' ? '#1A2233' : theme.accent),
              color: theme.id === 'business' ? '#2D0F15' : '#FFFFFF',
            }}
          >
            <BookmarkCheck size={12} />
            <span className="text-[9px] font-bold uppercase tracking-wider">已收藏</span>
          </motion.div>
        )}

        <div className="flex flex-col gap-2">
          {/* 英文 */}
          {(langMode === 'en' || langMode === 'bi') && (
            <p 
              className="text-[14.5px] md:text-lg font-normal leading-snug tracking-tight font-sans"
              style={{
                color: isSaved && !isActive ? savedStyle.color : 'inherit',
              }}
            >
              {renderTextWithHighlights(line.en, line.id, true)}
            </p>
          )}

          {/* 纯中文模式 */}
          {langMode === 'cn' && (
            <p 
              className="text-lg md:text-xl font-sans leading-snug"
              style={{
                color: isSaved && !isActive ? savedStyle.color : 'inherit',
              }}
            >
              {line.cn}
            </p>
          )}

          {/* 双语模式下的中文 */}
          {langMode === 'bi' && (
            <p 
              className="text-sm md:text-[16px] font-sans leading-snug opacity-70" 
              style={{ 
                letterSpacing: '0.01em',
                color: isSaved && !isActive ? savedStyle.color : 'inherit',
              }}
            >
              {line.cn}
            </p>
          )}
        </div>
      </motion.div>
    );
  };

  // 获取语言模式显示文本
  const getLangModeLabel = (mode: LangMode) => {
    switch (mode) {
      case 'bi': return 'Dual';
      case 'en': return 'EN';
      case 'cn': return 'CN';
    }
  };

  // 循环切换语言模式
  const cycleLangMode = () => {
    const modes: LangMode[] = ['bi', 'en', 'cn'];
    const currentIndex = modes.indexOf(langMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setLangMode(modes[nextIndex]);
  };

  // 获取语言按钮选中时的文字颜色（根据主题）
  const getActiveLangColor = () => {
    switch (theme.id) {
      case 'daily':
        return '#FFFFFF'; // white
      case 'cognitive':
        return '#A8C5DD'; // light blue
      case 'business':
        return '#2D0F15'; // plum wine（深色背景上用深色强调）
      default:
        return '#FFFFFF';
    }
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col relative overflow-hidden">

      {/* 字幕流 */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 w-full max-w-[1600px] mx-auto overflow-y-auto px-2 md:px-4 pb-24 no-scrollbar"
      >
        <div className="h-4" />

        {transcript.length === 0 && (
          <div className="flex items-center justify-center h-40 opacity-30">
            <p className="text-[10px] uppercase tracking-widest">No transcript available</p>
          </div>
        )}

        {useVirtualScroll ? (
          // 虚拟滚动模式
          <div style={{ height: totalHeight, position: 'relative' }}>
            <div style={{ transform: `translateY(${offsetY}px)`, display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {visibleItems.map(({ line, index }) => renderLine(line, index))}
            </div>
          </div>
        ) : (
          // 普通模式（行数 <= 50）
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {transcript.map((line, index) => renderLine(line, index))}
          </div>
        )}
      </div>

      {/* iOS风格悬浮语言切换按钮 - 使用 absolute 定位 */}
      <div className="absolute bottom-6 right-6 md:left-6 md:right-auto z-50 flex flex-col items-end md:items-start gap-2">
        {/* 展开的选项 */}
        <AnimatePresence>
          {isLangMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-2 mb-2"
            >
              {(['bi', 'en', 'cn'] as LangMode[]).map((mode) => (
                <motion.button
                  key={mode}
                  onClick={() => {
                    setLangMode(mode);
                    setIsLangMenuOpen(false);
                  }}
                  className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-lg border backdrop-blur-md transition-all touch-manipulation ${
                    langMode === mode ? 'opacity-100' : 'opacity-70'
                  }`}
                  style={{
                    backgroundColor: langMode === mode ? theme.accent : `${theme.bg}E6`,
                    color: langMode === mode ? getActiveLangColor() : theme.text,
                    borderColor: `${theme.text}10`,
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  {getLangModeLabel(mode)}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 主按钮 */}
        <motion.button
          onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-5 py-3 rounded-full shadow-2xl border backdrop-blur-xl touch-manipulation"
          style={{
            backgroundColor: `${theme.bg}E6`,
            color: theme.text,
            borderColor: `${theme.text}10`,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          }}
        >
          <Languages size={16} />
          <span className="text-[10px] font-bold uppercase tracking-widest">
            {getLangModeLabel(langMode)}
          </span>
        </motion.button>
      </div>
    </div>
  );
}
