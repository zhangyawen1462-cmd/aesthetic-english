"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { BookmarkCheck, Highlighter, Languages } from "lucide-react";
import type { TranscriptLine } from "@/data/types";
import type { ThemeConfig } from "@/lib/theme-config";
import { toggleNotebook, getNotebookByLesson } from "@/lib/notebook-store";

interface ModuleScriptProps {
  currentTime: number;
  isPlaying: boolean;
  theme: ThemeConfig;
  onSeek: (t: number) => void;
  setIsPlaying: (p: boolean) => void;
  transcript: TranscriptLine[];
  lessonId: string;
}

type LangMode = 'en' | 'cn' | 'bi';

// 虚拟滚动常量
const ITEM_HEIGHT = 100;      // 每行预估高度（px）
const OVERSCAN_COUNT = 5;     // 上下额外渲染的行数

export default function ModuleScript({ currentTime, isPlaying, theme, onSeek, setIsPlaying, transcript, lessonId }: ModuleScriptProps) {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [langMode, setLangMode] = useState<LangMode>('bi');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);

  // 是否使用虚拟滚动（仅当行数 > 50 时启用）
  const useVirtualScroll = transcript.length > 50;

  // 初始化：从 localStorage 读取已收藏的句子
  useEffect(() => {
    const items = getNotebookByLesson(lessonId);
    const ids = new Set(
      items.filter(i => i.type === 'sentence').map(i => i.id)
    );
    setSavedIds(ids);
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

  // 自动滚动到当前活跃行
  useEffect(() => {
    if (!isPlaying || !scrollContainerRef.current) return;

    const activeIndex = transcript.findIndex(
      (line) => currentTime >= line.start && currentTime <= line.end
    );
    if (activeIndex < 0) return;

    if (useVirtualScroll) {
      const targetScrollTop = activeIndex * ITEM_HEIGHT - containerHeight / 2 + ITEM_HEIGHT / 2;
      scrollContainerRef.current.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
    } else {
      // 非虚拟滚动时，使用 DOM 查询
      const el = scrollContainerRef.current.querySelector(`[data-line-id="${activeIndex}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentTime, isPlaying, transcript, useVirtualScroll, containerHeight]);

  const handleToggleSave = (line: TranscriptLine, e: React.MouseEvent) => {
    e.stopPropagation();
    const itemId = `${lessonId}-script-${line.id}`;
    const isNowSaved = toggleNotebook({
      id: itemId,
      lessonId,
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
  };

  const renderLine = (line: TranscriptLine, index: number) => {
    const isActive = currentTime >= line.start && currentTime <= line.end;
    const itemId = `${lessonId}-script-${line.id}`;
    const isSaved = savedIds.has(itemId);

    return (
      <motion.div
        key={line.id}
        data-line-id={index}
        onClick={() => { onSeek(line.start); setIsPlaying(true); }}
        animate={{ opacity: isActive ? 1 : (isSaved ? 0.8 : 0.25) }}
        className={`relative py-5 pl-6 pr-4 transition-all duration-500 cursor-pointer group border-l-[3px]
          ${isActive ? "border-current" : "border-transparent hover:border-black/5"}
        `}
        style={{
          borderColor: isActive ? theme.accent : 'transparent',
          ...(useVirtualScroll ? { height: ITEM_HEIGHT, boxSizing: 'border-box' as const } : {}),
        }}
      >
        {/* 高亮背景 */}
        {(isSaved || isActive) && (
          <div
            className="absolute inset-0 -z-10 rounded-r-lg transition-opacity duration-500 mix-blend-multiply"
            style={{
              backgroundColor: theme.highlight,
              opacity: isActive ? 1 : 0.5,
            }}
          />
        )}

        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-start gap-4">
            {/* 英文 */}
            {(langMode === 'en' || langMode === 'bi') && (
              <p className="text-lg font-normal leading-snug tracking-tight" style={{ fontFamily: 'Verdana, sans-serif' }}>
                {line.en}
              </p>
            )}

            {/* 纯中文模式 */}
            {langMode === 'cn' && (
              <p className="text-xl font-serif leading-snug text-current">
                {line.cn}
              </p>
            )}

            {/* 收藏按钮 */}
            <button
              onClick={(e) => handleToggleSave(line, e)}
              className={`opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ${isSaved ? "opacity-100 text-current" : "opacity-0"}`}
              style={{ color: theme.accent }}
            >
              {isSaved ? <BookmarkCheck size={18} /> : <Highlighter size={18} />}
            </button>
          </div>

          {/* 双语模式下的中文 */}
          {langMode === 'bi' && (
            <p className="text-[16px] font-serif leading-snug opacity-70" style={{ letterSpacing: '0.01em' }}>
              {line.cn}
            </p>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col relative overflow-hidden">

      {/* 1. 顶部工具栏 */}
      <div className="w-full px-8 py-4 flex justify-between items-center z-20 sticky top-0 backdrop-blur-sm border-b border-black/5" style={{ backgroundColor: theme.bg + 'CC' }}>
        <span className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-40 flex items-center gap-2">
          <Languages size={12} /> View Mode
        </span>
        <div className="flex gap-4">
          {(['en', 'bi', 'cn'] as LangMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setLangMode(mode)}
              className={`text-[9px] font-bold uppercase tracking-widest transition-all ${langMode === mode ? 'opacity-100 border-b-2' : 'opacity-30 hover:opacity-70'}`}
              style={{ borderColor: langMode === mode ? theme.accent : 'transparent', color: theme.text }}
            >
              {mode === 'bi' ? 'Bilingual' : mode === 'en' ? 'English' : 'Chinese'}
            </button>
          ))}
        </div>
      </div>

      {/* 2. 字幕流 */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 w-full max-w-3xl mx-auto overflow-y-auto px-8 pb-40 no-scrollbar space-y-2"
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
            <div style={{ transform: `translateY(${offsetY}px)` }}>
              {visibleItems.map(({ line, index }) => renderLine(line, index))}
            </div>
          </div>
        ) : (
          // 普通模式（行数 <= 50）
          transcript.map((line, index) => renderLine(line, index))
        )}
      </div>
    </div>
  );
}
