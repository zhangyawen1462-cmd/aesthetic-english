"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bookmark, Check, BookmarkCheck } from "lucide-react";
import { motion } from "framer-motion";
import type { GrammarNote } from "@/data/types";
import { toggleNotebook, getNotebookByLesson } from "@/lib/notebook-store";

import type { ThemeConfig } from "@/lib/theme-config";

interface ModuleGrammarProps {
  theme: ThemeConfig;
  onSeek: (time: number, autoPlay?: boolean) => void;
  grammarNotes: GrammarNote[];
  lessonId: string;
  category?: string;
}

export default function ModuleGrammar({ theme, onSeek, grammarNotes, lessonId, category }: ModuleGrammarProps) {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const [pressingItemId, setPressingItemId] = useState<string | null>(null);
  const [pressProgress, setPressProgress] = useState(0);
  const [justSavedId, setJustSavedId] = useState<string | null>(null);

  useEffect(() => {
    const items = getNotebookByLesson(lessonId);
    const ids = new Set(items.filter(i => i.type === 'grammar').map(i => i.id));
    setSavedIds(ids);
  }, [lessonId]);

  const handleToggleSave = (item: GrammarNote) => {
    const itemId = `${lessonId}-grammar-${item.id}`;
    const isNowSaved = toggleNotebook({
      id: itemId,
      lessonId,
      category,
      type: 'grammar',
      content: item.point,
      sub: item.ex,
      note: item.desc,
      timestamp: item.start,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
    });
    setSavedIds(prev => {
      const next = new Set(prev);
      if (isNowSaved) next.add(itemId); else next.delete(itemId);
      return next;
    });

    // 如果是收藏成功，显示成功动画
    if (isNowSaved) {
      setJustSavedId(itemId);
      setTimeout(() => setJustSavedId(null), 2000);
    }

    // 触发震动反馈（仅移动端）
    if (typeof window !== 'undefined' && window.navigator && 'vibrate' in window.navigator) {
      try {
        window.navigator.vibrate([30, 50, 30]);
      } catch (e) {
        console.log('Vibration not supported');
      }
    }
  };

  // 开始长按
  const handlePressStart = (item: GrammarNote, e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    const itemId = `${lessonId}-grammar-${item.id}`;
    setPressingItemId(itemId);
    setPressProgress(0);

    const startTime = Date.now();
    const duration = 2000; // 2秒

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setPressProgress(progress);

      if (progress < 1) {
        longPressTimer.current = setTimeout(updateProgress, 16) as any;
      } else {
        handleToggleSave(item);
        setPressingItemId(null);
        setPressProgress(0);
      }
    };

    updateProgress();
  };

  // 取消长按
  const handlePressCancel = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setPressingItemId(null);
    setPressProgress(0);
  };

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

  return (
    <div className="flex-1 w-full h-full flex flex-col relative overflow-hidden" style={{ color: theme.text }}>

      {/* 1. 背景层：点阵纸纹理 (Bullet Journal 风格) */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-[size:20px_20px]"
        style={{
          backgroundColor: theme.bg,
          backgroundImage: `radial-gradient(${theme.text}20 1px, transparent 1px)`
        }}
      />
      
      {/* 顶部做旧遮罩 */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] mix-blend-multiply"
        style={{ 
          backgroundImage: `url('/images/module-bg/grammar.jpg')`,
          filter: 'contrast(1.2)'
        }}
      />

      {/* 顶部标题 - 仅网页端显示 */}
      <div className="hidden md:block w-full px-8 py-6 z-20 sticky top-0 backdrop-blur-sm">
        <h1 className="font-bold" style={{ color: theme.text, fontSize: '30px', fontFamily: '"PingFang SC", -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>
          Grammar Notes
        </h1>
      </div>

      {/* 笔记流内容区 */}
      <div className="flex-1 w-full max-w-4xl mx-auto overflow-y-auto px-4 md:px-8 pb-40 no-scrollbar pt-8 md:pt-2">

        {grammarNotes.length === 0 && (
          <div className="flex items-center justify-center h-40 opacity-30">
            <p className="text-[10px] uppercase tracking-widest" style={{ fontFamily: '"PingFang SC", -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}>No Notes Recorded</p>
          </div>
        )}

        <div className="flex flex-col gap-4">
          
          {grammarNotes.map((item) => {
            const itemId = `${lessonId}-grammar-${item.id}`;
            const isSaved = savedIds.has(itemId);
            const isPressing = pressingItemId === itemId;
            const fillColor = getFillColor();
            const isJustSaved = justSavedId === itemId;

            return (
              <motion.div 
                key={item.id} 
                className="group relative cursor-pointer overflow-hidden rounded-lg"
                onMouseDown={(e) => handlePressStart(item, e)}
                onMouseUp={handlePressCancel}
                onMouseLeave={handlePressCancel}
                onTouchStart={(e) => handlePressStart(item, e)}
                onTouchEnd={handlePressCancel}
                animate={{ 
                  scale: isPressing ? 0.98 : 1,
                }}
                transition={{ duration: 0.15 }}
              >
                {/* 墨水填充效果 */}
                {isPressing && (
                  <motion.div
                    className="absolute inset-0 -z-10"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: pressProgress }}
                    transition={{ duration: 0, ease: 'linear' }}
                    style={{
                      backgroundColor: fillColor,
                      opacity: 0.3,
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
                    className="absolute top-2 right-2 flex items-center gap-1.5 px-3 py-1 rounded-full shadow-lg backdrop-blur-md z-10"
                    style={{
                      backgroundColor: theme.id === 'business' ? '#E8D5D8' : (theme.id === 'daily' ? '#1A2233' : theme.accent),
                      color: theme.id === 'business' ? '#2D0F15' : '#FFFFFF',
                    }}
                  >
                    <BookmarkCheck size={12} />
                    <span className="text-[9px] font-bold uppercase tracking-wider" style={{ fontFamily: '"PingFang SC", -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}>已收藏</span>
                  </motion.div>
                )}

                {/* 笔记主体 */}
                <div className="w-full relative z-0">
                  
                  {/* 标题行 */}
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <h3 className="text-base md:text-lg font-bold leading-snug transition-colors cursor-pointer"
                        style={{ color: theme.text, fontFamily: '"PingFang SC", -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}
                        onClick={(e) => { e.stopPropagation(); onSeek(item.start, true); }}
                        onMouseEnter={(e) => e.currentTarget.style.color = theme.accent}
                        onMouseLeave={(e) => e.currentTarget.style.color = theme.text}>
                      {item.point}
                    </h3>
                    
                    {/* 收藏状态指示器 */}
                    {isSaved && !isPressing && (
                      <div className="shrink-0 p-1.5 rounded-md transition-all"
                           style={{ 
                             color: theme.accent,
                             backgroundColor: `${theme.accent}10`
                           }}>
                        <Check size={14} />
                      </div>
                    )}
                  </div>

                  {/* 解释文本 */}
                  <div className="mb-2">
                    <p className="text-[13px] md:text-[14px] leading-relaxed opacity-80"
                       style={{ fontFamily: '"PingFang SC", -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}>
                      {item.desc}
                    </p>
                  </div>

                  {/* 例句块 - 主题色背景，与文本齐平 */}
                  <div className="relative py-2 px-3 rounded-md transition-colors duration-300"
                       style={{ backgroundColor: `${theme.accent}08` }}>
                    <p className="text-[13px] md:text-[14px] leading-relaxed opacity-90"
                       style={{ fontFamily: '"PingFang SC", -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', color: theme.accent }}>
                      {item.ex}
                    </p>
                  </div>

                </div>
              </motion.div>
            );
          })}

        </div>
      </div>
    </div>
  );
}
