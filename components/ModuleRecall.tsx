"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import type { RecallText } from "@/data/types";

import type { ThemeConfig } from "@/lib/theme-config";

interface ModuleRecallProps {
  theme: ThemeConfig;
  recallText: RecallText;
  lessonId?: string;
}

export default function ModuleRecall({ theme, recallText, lessonId }: ModuleRecallProps) {
  const [note, setNote] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const noteInputRef = useRef<HTMLTextAreaElement>(null);

  const color = theme.text;
  const paperColor = theme.bg;

  useEffect(() => {
    const saved = localStorage.getItem(`recall_note_${lessonId || 'default'}`);
    if (saved) setNote(saved);
  }, [lessonId]);

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNote(e.target.value);
    localStorage.setItem(`recall_note_${lessonId || 'default'}`, e.target.value);
  };

  return (
    <div 
      className="w-full min-h-full flex flex-col relative"
      style={{ 
        backgroundColor: paperColor,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.015'/%3E%3C/svg%3E")`,
      }}
    >
      {/* 上半部分：题目区域（固定在顶部，键盘弹起时可见） */}
      <div className="flex-shrink-0 w-full px-4 md:px-12 pt-8 md:pt-20 pb-4 md:pb-8">
        <div className="w-full max-w-3xl mx-auto space-y-6 md:space-y-12">

          {/* 1. 中文原文 - 博物馆展签（绝对主角） */}
          <motion.div
            animate={{ 
              opacity: isFocused ? 0.25 : 1,
              scale: isFocused ? 0.98 : 1,
              filter: isFocused ? 'blur(1px)' : 'blur(0px)',
            }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <p 
              className="text-base md:text-xl leading-relaxed"
              style={{ 
                color: color,
                fontWeight: 500,
                fontFamily: '"PingFang SC", -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                letterSpacing: '0.01em',
                lineHeight: '1.75',
                wordBreak: 'keep-all',
                overflowWrap: 'break-word',
              }}
            >
              {recallText.cn}
            </p>
          </motion.div>

          {/* 2. 英文答案 - 水汽镜子（优雅的终点） */}
          <motion.div
            animate={{ 
              opacity: isFocused ? 0.15 : 1,
              scale: isFocused ? 0.98 : 1,
              filter: isFocused ? 'blur(2px)' : 'blur(0px)',
            }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative py-6 md:py-12 cursor-pointer"
            style={{ 
              minHeight: '100px',
              userSelect: isRevealed ? 'text' : 'none',
            }}
            onMouseDown={() => setIsRevealed(true)}
            onMouseUp={() => setIsRevealed(false)}
            onMouseLeave={() => setIsRevealed(false)}
            onTouchStart={() => setIsRevealed(true)}
            onTouchEnd={() => setIsRevealed(false)}
          >
            {/* 英文文本 - 墨水晕开效果 */}
            <motion.p
              animate={{ 
                filter: isRevealed ? 'blur(0px)' : 'blur(14px)',
                scale: isRevealed ? 1 : 0.995,
              }}
              transition={{ 
                duration: 0.8, 
                ease: [0.16, 1, 0.3, 1],
              }}
              className="text-sm md:text-xl leading-loose"
              style={{ 
                color: color,
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
                fontWeight: 400,
                letterSpacing: '0.01em',
                lineHeight: '1.85',
                opacity: 0.9,
                wordBreak: 'normal',
                overflowWrap: 'break-word',
              }}
            >
              {recallText.en}
            </motion.p>

            {/* 提示文字 */}
            {!isRevealed && !isFocused && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.2 }}
                exit={{ opacity: 0 }}
                className="absolute bottom-2 left-0 right-0 flex justify-center pointer-events-none"
              >
                <span 
                  className="text-[8px] uppercase tracking-[0.35em]"
                  style={{ 
                    color: color,
                    fontWeight: 400,
                    fontFamily: '"PingFang SC", -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  }}
                >
                  Press to Reveal
                </span>
              </motion.div>
            )}
          </motion.div>

        </div>
      </div>

      {/* 下半部分：打字机区域（自适应高度） */}
      <div className="flex-1 w-full px-4 md:px-12 pb-4 md:pb-12 overflow-y-auto">
        <div className="w-full max-w-3xl mx-auto">
          
          <motion.div
            animate={{ 
              opacity: isFocused ? 1 : 0.35,
            }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            {/* 极细分割线 */}
            <div 
              className="absolute top-0 left-0 right-0 h-[0.5px]"
              style={{ 
                backgroundColor: color,
                opacity: isFocused ? 0.3 : 0.1,
              }}
            />

            {/* 打字机输入区 - Monospace */}
            <textarea
              ref={noteInputRef}
              value={note}
              onChange={handleNoteChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder=""
              className="w-full min-h-[120px] md:min-h-[180px] bg-transparent outline-none resize-none pt-6 leading-relaxed"
              style={{ 
                color: color,
                fontSize: '14px',
                fontFamily: '"SF Mono", "Monaco", "Consolas", "Courier New", monospace',
                fontWeight: isFocused ? 500 : 400,
                letterSpacing: '0.01em',
                lineHeight: '1.75',
              }}
              spellCheck={false}
            />

            {/* Placeholder */}
            {!note && !isFocused && (
              <div 
                className="absolute top-6 left-0 pointer-events-none"
                style={{ 
                  color: color,
                  opacity: 0.15,
                  fontSize: '14px',
                  fontFamily: '"SF Mono", monospace',
                }}
              >
                Begin typing...
              </div>
            )}

            {/* 光标 - 最亮的元素 */}
            {isFocused && (
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-2 left-0 w-[2px] h-5"
                style={{ backgroundColor: color }}
              />
            )}
          </motion.div>

        </div>
      </div>

    </div>
  );
}
