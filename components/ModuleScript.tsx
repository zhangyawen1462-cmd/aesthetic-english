"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookmarkCheck, Languages, Copy, Bookmark, Edit3, Star } from "lucide-react";
import type { TranscriptLine } from "@/data/types";
import type { ThemeConfig } from "@/lib/theme-config";
import { toggleNotebook, getNotebookByLesson } from "@/lib/notebook-store";
import { toggleWordHighlight, getHighlightsByLesson } from "@/lib/word-highlight-store";

export type LangMode = 'en' | 'cn' | 'bi';

interface ModuleScriptProps {
  currentTime: number;
  isPlaying: boolean;
  theme: ThemeConfig;
  onSeek: (t: number, autoPlay?: boolean) => void;
  setIsPlaying: (p: boolean) => void;
  transcript: TranscriptLine[];
  lessonId: string;
  category?: string;
  langMode?: LangMode;
  onLangModeChange?: (mode: LangMode) => void;
}

export default function ModuleScript({ currentTime, isPlaying, theme, onSeek, setIsPlaying, transcript, lessonId, category, langMode: externalLangMode, onLangModeChange }: ModuleScriptProps) {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [internalLangMode, setInternalLangMode] = useState<LangMode>('bi');
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  
  // 使用外部传入的 langMode，如果没有则使用内部状态
  const langMode = externalLangMode !== undefined ? externalLangMode : internalLangMode;
  const setLangMode = (mode: LangMode) => {
    if (onLangModeChange) {
      onLangModeChange(mode);
    } else {
      setInternalLangMode(mode);
    }
  };
  
  // 🎯 检测是否为移动端
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [notes, setNotes] = useState<{ [key: string]: string }>({});
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  
  // 🎨 荧光笔系统
  const [highlights, setHighlights] = useState<Array<{
    id: string;
    text: string;
    color: string;
    lineId: number;
    startOffset: number;
    endOffset: number;
  }>>([]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorPickerPosition, setColorPickerPosition] = useState({ x: 0, y: 0 });
  const [selectedRange, setSelectedRange] = useState<{
    text: string;
    lineId: number;
    startOffset: number;
    endOffset: number;
  } | null>(null);
  
  // 🎯 用户接管模式（离合器）
  const [isUserControlled, setIsUserControlled] = useState(false);
  const userControlTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastAutoScrollIndex = useRef<number>(-1);

  // 初始化：从 localStorage 读取已收藏的句子和荧光笔高亮
  useEffect(() => {
    const items = getNotebookByLesson(lessonId);
    const ids = new Set(
      items.filter(i => i.type === 'sentence').map(i => i.id)
    );
    setSavedIds(ids);
    
    // 读取荧光笔高亮
    const savedHighlights = localStorage.getItem(`highlights_${lessonId}`);
    if (savedHighlights) {
      setHighlights(JSON.parse(savedHighlights));
    }
    
    // 读取笔记
    const savedNotes = localStorage.getItem(`script_notes_${lessonId}`);
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes));
    }
  }, [lessonId]);

  // 🎯 监听用户滚动操作（启动离合器）
  const handleUserScroll = useCallback(() => {
    // 用户手动滚动，进入接管模式
    setIsUserControlled(true);
    
    // 清除之前的定时器
    if (userControlTimeoutRef.current) {
      clearTimeout(userControlTimeoutRef.current);
    }
    
    // 3秒无操作后，自动退出接管模式
    userControlTimeoutRef.current = setTimeout(() => {
      setIsUserControlled(false);
    }, 3000);
  }, []);

  // 🎯 用户触摸字幕区域，立即进入接管模式
  const handleUserTouch = useCallback(() => {
    setIsUserControlled(true);
    if (userControlTimeoutRef.current) {
      clearTimeout(userControlTimeoutRef.current);
    }
  }, []);

  // 🎯 自动滚动到当前活跃行（仅在非接管模式下）- 优化性能
  useEffect(() => {
    // 如果用户正在手动控制，不执行自动滚动
    if (isUserControlled || !isPlaying || !scrollContainerRef.current) return;

    const activeIndex = transcript.findIndex(
      (line) => currentTime >= line.start && currentTime <= line.end
    );
    if (activeIndex < 0) return;

    // 只在切换到新行时才滚动（性能优化：避免频繁滚动）
    if (activeIndex === lastAutoScrollIndex.current) return;
    lastAutoScrollIndex.current = activeIndex;

    // 使用 requestAnimationFrame 优化滚动性能
    requestAnimationFrame(() => {
      const container = scrollContainerRef.current;
      if (!container) return;
      
      const activeElement = container.querySelector(`[data-line-id="${activeIndex}"]`) as HTMLElement;
      
      if (activeElement) {
        const elementTop = activeElement.offsetTop;
        
        // 🎯 字幕立即滚动到顶部（移动端和桌面端统一）- 移除阈值判断，确保灵敏响应
        const targetScrollTop = elementTop - 16; // 距离顶部 16px
        
        // 直接滚动，不做阈值判断，确保每次切换字幕都立即滚动
        container.scrollTo({
          top: targetScrollTop,
          behavior: 'smooth'
        });
      }
    });
  }, [currentTime, isPlaying, transcript, isUserControlled, isMobile]);

  // 🎯 手动定位到当前播放位置
  const scrollToCurrentLine = useCallback(() => {
    if (!scrollContainerRef.current) return;

    const activeIndex = transcript.findIndex(
      (line) => currentTime >= line.start && currentTime <= line.end
    );
    if (activeIndex < 0) return;

    const container = scrollContainerRef.current;
    const activeElement = container.querySelector(`[data-line-id="${activeIndex}"]`) as HTMLElement;
    
    if (activeElement) {
      const elementTop = activeElement.offsetTop;
      const elementHeight = activeElement.offsetHeight;
      const containerClientHeight = container.clientHeight;
      const targetScrollTop = elementTop - (containerClientHeight / 2) + (elementHeight / 2);
      
      container.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth'
      });
    }

    // 退出接管模式
    setIsUserControlled(false);
    if (userControlTimeoutRef.current) {
      clearTimeout(userControlTimeoutRef.current);
    }
  }, [currentTime, transcript]);

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

    // 触发震动反馈（仅移动端）
    if (typeof window !== 'undefined' && window.navigator && 'vibrate' in window.navigator) {
      try {
        window.navigator.vibrate([30, 50, 30]);
      } catch (e) {
        console.log('Vibration not supported');
      }
    }
  };

  // 🎨 高级高亮/醒目色系 (Premium Vibrant) - 极度醒目，但有质感
  const highlightColors = [
    { id: 'yellow', color: '#FFEA28', name: '马克黄' }, // 极其醒目的亮黄，不发绿
    { id: 'green', color: '#32FF7E', name: '苹果青' },  // 像运动品牌常用的鲜活亮绿
    { id: 'pink', color: '#FF5EBC', name: '亮芭比粉' }, // 视觉冲击力极强的亮粉色
    { id: 'blue', color: '#00D8FF', name: '冰川蓝' },   // 清透但饱和度极高的水蓝
  ];

  const activeHighlightColors = highlightColors;

  // 🎨 处理文本选择（完美修复重名单词打乱 Bug）
  const handleTextSelection = useCallback((lineId: number, fullText: string, event: React.MouseEvent | React.TouchEvent) => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setShowColorPicker(false);
      return;
    }

    const selectedText = selection.toString().trim();
    if (!selectedText) {
      setShowColorPicker(false);
      return;
    }

    const range = selection.getRangeAt(0);
    const container = event.currentTarget as HTMLElement;

    // 🎯 核心修复：使用 TreeWalker 遍历底层 DOM，精准计算绝对字符偏移量
    let startOffset = 0;
    const treeWalker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
    let currentNode = treeWalker.nextNode();

    while (currentNode) {
      if (currentNode === range.startContainer) {
        // 找到了用户划线起点的那个节点，加上光标在该节点内的相对偏移量
        startOffset += range.startOffset;
        break;
      }
      // 如果还没找到起点，就把当前经过的节点长度累加起来
      startOffset += currentNode.textContent?.length || 0;
      currentNode = treeWalker.nextNode();
    }

    // 处理用户手抖不小心多选的首尾空格
    const fullSelectedText = selection.toString();
    const trimStartCount = fullSelectedText.length - fullSelectedText.trimStart().length;
    
    const finalStartOffset = startOffset + trimStartCount;
    const finalEndOffset = finalStartOffset + selectedText.length;

    // 获取鼠标/触摸位置
    let mouseX = 0;
    let mouseY = 0;
    const isTouchEvent = 'touches' in event;
    
    if (isTouchEvent) {
      // 触摸事件
      const touch = event.touches[0] || event.changedTouches[0];
      mouseX = touch.clientX;
      mouseY = touch.clientY;
    } else {
      // 鼠标事件
      mouseX = event.clientX;
      mouseY = event.clientY;
    }

    // 设置调色盘位置：移动端更近，桌面端稍远
    if (isTouchEvent) {
      // 移动端：更靠近触摸点
      setColorPickerPosition({
        x: mouseX + 8,  // 触摸点右侧 8px
        y: mouseY - 32, // 触摸点上方 32px
      });
    } else {
      // 桌面端：保持原有距离
      setColorPickerPosition({
        x: mouseX + 32, // 鼠标右侧 32px
        y: mouseY - 48, // 鼠标上方 48px
      });
    }

    setSelectedRange({
      text: selectedText,
      lineId,
      startOffset: finalStartOffset,
      endOffset: finalEndOffset,
    });

    setShowColorPicker(true);
  }, []);

  // 🎨 应用荧光笔颜色
  const applyHighlight = useCallback((color: string) => {
    if (!selectedRange) return;

    // 🛡️ 防御性检查：拦截与已有高亮重叠的选区
    const hasOverlap = highlights.some(h => 
      h.lineId === selectedRange.lineId && 
      !(selectedRange.endOffset <= h.startOffset || selectedRange.startOffset >= h.endOffset)
    );

    if (hasOverlap) {
      // 重叠时：清除选择，关闭调色盘，轻震动提示
      window.getSelection()?.removeAllRanges();
      setShowColorPicker(false);
      setSelectedRange(null);
      
      // 轻微的"拒绝"震动反馈（两次短促震动）
      if (typeof window !== 'undefined' && window.navigator && 'vibrate' in window.navigator) {
        try {
          window.navigator.vibrate([15, 30, 15]);
        } catch (e) {
          console.log('Vibration not supported');
        }
      }
      return;
    }

    const newHighlight = {
      id: `${lessonId}-${selectedRange.lineId}-${Date.now()}`,
      text: selectedRange.text,
      color,
      lineId: selectedRange.lineId,
      startOffset: selectedRange.startOffset,
      endOffset: selectedRange.endOffset,
    };

    const newHighlights = [...highlights, newHighlight];
    setHighlights(newHighlights);
    localStorage.setItem(`highlights_${lessonId}`, JSON.stringify(newHighlights));

    // 清除选择
    window.getSelection()?.removeAllRanges();
    setShowColorPicker(false);
    setSelectedRange(null);

    // 成功的震动反馈
    if (typeof window !== 'undefined' && window.navigator && 'vibrate' in window.navigator) {
      try {
        window.navigator.vibrate([20]);
      } catch (e) {
        console.log('Vibration not supported');
      }
    }
  }, [selectedRange, highlights, lessonId]);

  // 🎨 删除荧光笔
  const removeHighlight = useCallback((highlightId: string) => {
    const newHighlights = highlights.filter(h => h.id !== highlightId);
    setHighlights(newHighlights);
    localStorage.setItem(`highlights_${lessonId}`, JSON.stringify(newHighlights));
  }, [highlights, lessonId]);

  // 🆕 复制功能
  const handleCopy = (line: TranscriptLine, e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `${line.en}\n${line.cn}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(line.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // 🆕 笔记功能
  const handleNoteToggle = (lineId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingNoteId(editingNoteId === lineId ? null : lineId);
  };

  const handleNoteSave = (lineId: number, note: string) => {
    const itemId = `${lessonId}-script-${lineId}`;
    const newNotes = { ...notes, [itemId]: note };
    setNotes(newNotes);
    localStorage.setItem(`script_notes_${lessonId}`, JSON.stringify(newNotes));
    // 不自动关闭编辑区，让用户通过点击笔记图标来控制
  };



  // 🆕 格式化时间
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 🆕 处理字幕点击播放
  const handleLineClick = useCallback((time: number) => {
    onSeek(time);
    setIsPlaying(true);
  }, [onSeek, setIsPlaying]);

  // 🎨 渲染带荧光笔效果的文本
  const renderTextWithHighlights = (text: string, lineId: number) => {
    const lineHighlights = highlights.filter(h => h.lineId === lineId);
    
    if (lineHighlights.length === 0) {
      return text;
    }

    // 判断是否为深色主题
    const isDarkTheme = theme.id === 'business';

    // 按照 startOffset 排序
    const sortedHighlights = [...lineHighlights].sort((a, b) => a.startOffset - b.startOffset);
    
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    sortedHighlights.forEach((highlight, idx) => {
      // 验证偏移量是否有效
      if (highlight.startOffset < 0 || highlight.endOffset > text.length || highlight.startOffset >= highlight.endOffset) {
        return; // 跳过无效的高亮
      }

      // 添加高亮前的普通文本
      if (highlight.startOffset > lastIndex) {
        parts.push(
          <span key={`text-${idx}`}>
            {text.substring(lastIndex, highlight.startOffset)}
          </span>
        );
      }

      // 添加高亮文本 - 醒目且高级的马克笔样式
      parts.push(
        <span
          key={`highlight-${highlight.id}`}
          // px-[3px] 让荧光色稍微包裹住文字，rounded-[3px] 增加现代感
          className="relative inline-block cursor-pointer px-[3px] mx-[1px] rounded-[3px] transition-all hover:opacity-80"
          style={{
            // 颜色后加 D9 代表 85% 透明度，让颜色极其鲜艳但不覆盖字体的锐利度
            backgroundColor: isDarkTheme ? '#F5E6E8' : `${highlight.color}D9`,
            color: isDarkTheme ? '#5D1F27' : '#000000', // 醒目的底色上，文字用纯黑对比度最高、最清晰
            mixBlendMode: 'normal',
            boxDecorationBreak: 'clone',
            WebkitBoxDecorationBreak: 'clone',
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            removeHighlight(highlight.id);
          }}
        >
          {text.substring(highlight.startOffset, highlight.endOffset)}
        </span>
      );

      lastIndex = highlight.endOffset;
    });

    // 添加最后的普通文本
    if (lastIndex < text.length) {
      parts.push(
        <span key="text-end">
          {text.substring(lastIndex)}
        </span>
      );
    }

    return <>{parts}</>;
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

  // 获取活跃字幕的背景色（更浅，形成对比）
  const getActiveBgColor = () => {
    switch (theme.id) {
      case 'daily':
        // 荧光黄色 - 更鲜艳的马克笔黄
        return '#FFF4CC';
      case 'cognitive':
        // 荧光黄色 - 明亮的柠檬黄
        return '#FFF5D6';
      case 'business':
        // plum wine(#2D0F15)的浅色版本
        // HSL(348°, 20%, 29%) - 深红木色，比plum wine浅但保持酒红调
        return '#5A3A3F';
      default:
        return '#F5F5F5'; // 默认浅灰色
    }
  };

  // 获取文字颜色（根据主题）
  const getTextColor = () => {
    switch (theme.id) {
      case 'daily':
        return '#000000'; // 纯黑色
      default:
        return 'inherit'; // 其他主题继承默认颜色
    }
  };

  // 获取活跃字幕的边框颜色（与文字颜色相同，稍微透明）
  const getActiveBorderColor = () => {
    const textColor = getTextColor();
    if (textColor === '#000000') {
      return 'rgba(0, 0, 0, 0.15)'; // 纯黑色的15%透明度
    }
    return `${theme.text}26`; // 其他主题使用主题文字颜色的15%透明度
  };

  const renderLine = (line: TranscriptLine, index: number) => {
    const isActive = currentTime >= line.start && currentTime <= line.end;
    const itemId = `${lessonId}-script-${line.id}`;
    const isSaved = savedIds.has(itemId);
    const fillColor = getFillColor();
    const savedStyle = getSavedStyle();
    const isCopied = copiedId === line.id;
    const hasNote = !!notes[itemId];
    const isEditingNote = editingNoteId === line.id;

    return (
      <motion.div
        key={line.id}
        data-line-id={index}
        onClick={() => handleLineClick(line.start)}
        initial={false}
        className={`relative py-4 px-2 md:px-5 mb-1 transition-all duration-300 cursor-pointer group overflow-hidden rounded-[6px]`}
        style={{
          backgroundColor: isActive ? getActiveBgColor() : (isSaved ? savedStyle.backgroundColor : `${theme.bg}F5`),
          boxShadow: isActive 
            ? '0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 4px rgba(0, 0, 0, 0.02), 0 1px 2px rgba(0, 0, 0, 0.01)'
            : '0 2px 6px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)',
          border: isActive ? `0.5px solid ${getActiveBorderColor()}` : 'none',
        }}
      >
        {/* 收藏后的背景色 */}
        {isSaved && !isActive && (
          <div
            className="absolute inset-0 -z-10 rounded-[6px] transition-all duration-500"
            style={{
              backgroundColor: savedStyle.backgroundColor,
            }}
          />
        )}

        {/* 活跃状态的高亮背景 */}
        {isActive && (
          <div
            className="absolute inset-0 -z-10 rounded-[6px] transition-opacity duration-300"
            style={{
              backgroundColor: theme.highlight,
              opacity: 0.15,
            }}
          />
        )}
        
        {/* 活跃状态的顶部黄色高亮条（竞品风格） */}
        {isActive && (
          <div
            className="absolute top-0 left-0 right-0 h-[3px] rounded-t-[6px]"
            style={{
              backgroundColor: theme.accent,
            }}
          />
        )}

        <div className="flex flex-col gap-2">
          {/* 英文 - 放大1号 + 加粗 + 移动端缩小1号 */}
          {(langMode === 'en' || langMode === 'bi') && (
            <p 
              className={`font-medium tracking-tight select-text transition-all duration-300 ${
                isActive ? 'text-[19px] md:text-[23px]' : 'text-[18px] md:text-[22px]'
              }`}
              style={{
                color: isSaved && !isActive ? savedStyle.color : getTextColor(),
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", system-ui, sans-serif',
                lineHeight: '1.2',
              }}
              onMouseUp={(e) => handleTextSelection(line.id, line.en, e)}
              onTouchEnd={(e) => handleTextSelection(line.id, line.en, e)}
            >
              {renderTextWithHighlights(line.en, line.id)}
            </p>
          )}

          {/* 纯中文模式 - 缩小1号 + 调浅 + 移动端缩小1号 */}
          {langMode === 'cn' && (
            <p 
              className={`select-text transition-all duration-300 ${
                isActive ? 'text-[20px] md:text-[23px]' : 'text-[19px] md:text-[22px]'
              }`}
              style={{
                color: isSaved && !isActive ? savedStyle.color : getTextColor(),
                opacity: 0.75,
                fontFamily: '"PingFang SC", -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", "Microsoft YaHei", sans-serif',
                lineHeight: '1.2',
              }}
              onMouseUp={(e) => handleTextSelection(line.id + 10000, line.cn, e)}
              onTouchEnd={(e) => handleTextSelection(line.id + 10000, line.cn, e)}
            >
              {renderTextWithHighlights(line.cn, line.id + 10000)}
            </p>
          )}

          {/* 双语模式下的中文 - 缩小1号 + 调浅 + 移动端缩小1号 */}
          {langMode === 'bi' && (
            <p 
              className={`select-text transition-all duration-300 ${
                isActive ? 'text-[16px] md:text-[19px]' : 'text-[15px] md:text-[18px]'
              }`}
              style={{ 
                letterSpacing: '0.01em',
                color: isSaved && !isActive ? savedStyle.color : getTextColor(),
                opacity: 0.75,
                fontFamily: '"PingFang SC", -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", "Microsoft YaHei", sans-serif',
                lineHeight: '1.2',
              }}
              onMouseUp={(e) => handleTextSelection(line.id + 10000, line.cn, e)}
              onTouchEnd={(e) => handleTextSelection(line.id + 10000, line.cn, e)}
            >
              {renderTextWithHighlights(line.cn, line.id + 10000)}
            </p>
          )}

          {/* 底部：操作图标 - 独占一行，不与字幕重叠 */}
          <div className="flex items-center justify-between -mt-1">
            {/* 左侧：时间轴 - 放大1.2倍 + 向右移动0.2rem */}
            <span 
              className="text-[12px] font-mono opacity-40"
              style={{ 
                color: theme.text,
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Mono", "Menlo", monospace',
                marginLeft: '0.2rem'
              }}
            >
              {formatTime(line.start)}
            </span>

            {/* 右侧：操作图标 */}
            <div className="flex items-center gap-4 opacity-50 group-hover:opacity-100 transition-opacity">
              {/* 播放 */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={(e) => { e.stopPropagation(); handleLineClick(line.start); }}
                className="hover:opacity-70 transition-opacity"
                style={{ color: theme.text }}
                title="播放"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polygon points="10 8 16 12 10 16 10 8"/>
                </svg>
              </motion.button>

              {/* 复制 */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={(e) => handleCopy(line, e)}
                className="hover:opacity-70 transition-opacity"
                style={{ color: isCopied ? theme.accent : theme.text }}
                title="复制"
              >
                {isCopied ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : (
                  <Copy size={14} />
                )}
              </motion.button>

              {/* 收藏 - 改为星星 */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={(e) => { e.stopPropagation(); handleToggleSave(line); }}
                className="hover:opacity-70 transition-opacity"
                style={{ color: isSaved ? theme.accent : theme.text }}
                title="收藏"
              >
                <Star size={14} fill={isSaved ? theme.accent : 'none'} />
              </motion.button>

              {/* 笔记 */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={(e) => handleNoteToggle(line.id, e)}
                className="hover:opacity-70 transition-opacity"
                style={{ color: hasNote || isEditingNote ? theme.accent : theme.text }}
                title="笔记"
              >
                <Edit3 size={14} />
              </motion.button>
            </div>
          </div>

          {/* 笔记编辑区 */}
          <AnimatePresence>
            {isEditingNote && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="mt-2 overflow-hidden"
              >
                <textarea
                  autoFocus
                  defaultValue={notes[itemId] || ''}
                  onChange={(e) => handleNoteSave(line.id, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="写下你的笔记..."
                  className="w-full p-2 text-sm rounded-md border outline-none resize-none"
                  style={{
                    backgroundColor: `${theme.bg}80`,
                    borderColor: `${theme.accent}30`,
                    color: theme.text,
                    fontFamily: '"PingFang SC", -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  }}
                  rows={3}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* 显示已有笔记 */}
          {hasNote && !isEditingNote && (
            <div 
              className="mt-2 p-2 text-sm rounded-md border-l-2"
              style={{
                backgroundColor: `${theme.accent}08`,
                borderColor: theme.accent,
                color: theme.text,
                fontFamily: '"PingFang SC", -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              }}
            >
              {notes[itemId]}
            </div>
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
        onScroll={handleUserScroll}
        onTouchStart={handleUserTouch}
        // 右侧边距改为 0，让内容容器的 pr-[0.8rem] 统一控制
        className="flex-1 w-full max-w-[1600px] mx-auto overflow-y-auto pl-2 pr-0 md:pl-4 md:pr-0 pb-36 md:pb-48 no-scrollbar"
      >
        <div className="h-4" />

        {transcript.length === 0 && (
          <div className="flex items-center justify-center h-40 opacity-30">
            <p className="text-[10px] uppercase tracking-widest">No transcript available</p>
          </div>
        )}

        {/* 原生 DOM 渲染所有字幕 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {transcript.map((line, index) => renderLine(line, index))}
        </div>
      </div>

      {/* iOS风格悬浮语言切换按钮 - 仅桌面端显示 */}
      <div 
        className="hidden md:flex absolute z-40 flex-col items-start gap-2"
        style={{
          // 动态计算底部距离：基础高度 + iPhone底部安全横条高度 + (如果底部有黑框播放条，可以适当再加大 2rem)
          bottom: 'calc(2rem + env(safe-area-inset-bottom))',
          // 强制靠左，因为右侧已经是密集的垂直导航栏了
          left: '1.5rem', 
        }}
      >
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

      {/* 🎨 荧光笔调色盘 - 移动端更小更近 */}
      <AnimatePresence>
        {showColorPicker && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="fixed z-[100] flex items-center gap-1.5 md:gap-2 px-1.5 md:px-2.5 py-1.5 md:py-2 rounded-full backdrop-blur-xl border shadow-2xl"
            style={{
              left: `${colorPickerPosition.x}px`,
              top: `${colorPickerPosition.y}px`,
              backgroundColor: '#FFFFFF',
              borderColor: 'rgba(0, 0, 0, 0.1)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.08)',
            }}
          >
            {activeHighlightColors.map((color) => (
              <motion.button
                key={color.id}
                onClick={() => applyHighlight(color.color)}
                whileTap={{ scale: 0.9 }}
                // 🎯 移动端更小：w-5 h-5 (20px)，桌面端 w-6 h-6 (24px)
                className="w-5 h-5 md:w-6 md:h-6 rounded-full border-2 border-white transition-transform active:scale-90"
                style={{
                  backgroundColor: color.color,
                  boxShadow: `0 2px 6px ${color.color}60, 0 1px 2px rgba(0,0,0,0.05)`, 
                }}
                title={color.name}
              />
            ))}
            {/* 🎯 关闭按钮同步缩小 */}
            <motion.button
              onClick={() => {
                setShowColorPicker(false);
                window.getSelection()?.removeAllRanges();
              }}
              whileTap={{ scale: 0.9 }}
              className="w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center text-[9px] md:text-[10px] font-bold transition-opacity active:opacity-70"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.08)',
                color: '#333333',
              }}
            >
              ✕
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
