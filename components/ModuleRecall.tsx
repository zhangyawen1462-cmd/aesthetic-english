"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

  // 🎨 荧光笔系统
  const [highlights, setHighlights] = useState<Array<{
    id: string;
    text: string;
    color: string;
    type: 'cn' | 'en'; // 区分中文和英文
    startOffset: number;
    endOffset: number;
  }>>([]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorPickerPosition, setColorPickerPosition] = useState({ x: 0, y: 0 });
  const [selectedRange, setSelectedRange] = useState<{
    text: string;
    type: 'cn' | 'en';
    startOffset: number;
    endOffset: number;
  } | null>(null);

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

  const color = theme.text;
  const paperColor = theme.bg;

  useEffect(() => {
    const saved = localStorage.getItem(`recall_note_${lessonId || 'default'}`);
    if (saved) setNote(saved);

    // 读取荧光笔高亮
    const savedHighlights = localStorage.getItem(`recall_highlights_${lessonId || 'default'}`);
    if (savedHighlights) {
      setHighlights(JSON.parse(savedHighlights));
    }
  }, [lessonId]);

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNote(e.target.value);
    localStorage.setItem(`recall_note_${lessonId || 'default'}`, e.target.value);
  };

  // 🎨 荧光笔颜色
  const highlightColors = [
    { id: 'yellow', color: '#FFEA28', name: '马克黄' },
    { id: 'green', color: '#32FF7E', name: '苹果青' },
    { id: 'pink', color: '#FF5EBC', name: '亮芭比粉' },
    { id: 'blue', color: '#00D8FF', name: '冰川蓝' },
  ];

  // 🎨 文本选择处理
  const handleTextSelection = useCallback((type: 'cn' | 'en', fullText: string, event: React.MouseEvent | any) => {
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

    let startOffset = 0;
    const treeWalker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
    let currentNode = treeWalker.nextNode();

    while (currentNode) {
      if (currentNode === range.startContainer) {
        startOffset += range.startOffset;
        break;
      }
      startOffset += currentNode.textContent?.length || 0;
      currentNode = treeWalker.nextNode();
    }

    const fullSelectedText = selection.toString();
    const trimStartCount = fullSelectedText.length - fullSelectedText.trimStart().length;
    
    const finalStartOffset = startOffset + trimStartCount;
    const finalEndOffset = finalStartOffset + selectedText.length;

    const rangeRect = range.getBoundingClientRect();
    const pickerWidth = isMobile ? 140 : 160;
    const pickerHeight = isMobile ? 36 : 40;
    const viewportWidth = window.innerWidth;
    
    const selectionCenterX = rangeRect.left + rangeRect.width / 2;
    const selectionTop = rangeRect.top;
    const selectionBottom = rangeRect.bottom;
    
    let finalX = selectionCenterX - pickerWidth / 2;
    let finalY = selectionTop - pickerHeight - 12;
    
    if (finalX < 8) finalX = 8;
    if (finalX + pickerWidth > viewportWidth - 8) {
      finalX = viewportWidth - pickerWidth - 8;
    }
    
    if (finalY < 8) {
      finalY = selectionBottom + 12;
    }
    
    setColorPickerPosition({ x: finalX, y: finalY });
    setSelectedRange({
      text: selectedText,
      type,
      startOffset: finalStartOffset,
      endOffset: finalEndOffset,
    });
    setShowColorPicker(true);

    // 移动端震动反馈
    if (isMobile && window.navigator && 'vibrate' in window.navigator) {
      try {
        window.navigator.vibrate([10]);
      } catch (e) {
        console.log('Vibration not supported');
      }
    }
  }, [isMobile]);

  // 🎨 应用荧光笔颜色
  const applyHighlight = useCallback((color: string) => {
    if (!selectedRange) return;

    // 检查重叠
    const hasOverlap = highlights.some(h => 
      h.type === selectedRange.type && 
      !(selectedRange.endOffset <= h.startOffset || selectedRange.startOffset >= h.endOffset)
    );

    if (hasOverlap) {
      window.getSelection()?.removeAllRanges();
      setShowColorPicker(false);
      setSelectedRange(null);
      
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
      id: `${lessonId || 'default'}-${selectedRange.type}-${Date.now()}`,
      text: selectedRange.text,
      color,
      type: selectedRange.type,
      startOffset: selectedRange.startOffset,
      endOffset: selectedRange.endOffset,
    };

    const newHighlights = [...highlights, newHighlight];
    setHighlights(newHighlights);
    localStorage.setItem(`recall_highlights_${lessonId || 'default'}`, JSON.stringify(newHighlights));

    window.getSelection()?.removeAllRanges();
    setShowColorPicker(false);
    setSelectedRange(null);

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
    localStorage.setItem(`recall_highlights_${lessonId || 'default'}`, JSON.stringify(newHighlights));
  }, [highlights, lessonId]);

  // 🎨 渲染带荧光笔效果的文本
  const renderTextWithHighlights = (text: string, type: 'cn' | 'en') => {
    const textHighlights = highlights.filter(h => h.type === type);
    
    if (textHighlights.length === 0) {
      return text;
    }

    const isDarkTheme = theme.id === 'business';
    const sortedHighlights = [...textHighlights].sort((a, b) => a.startOffset - b.startOffset);
    
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    sortedHighlights.forEach((highlight, idx) => {
      if (highlight.startOffset < 0 || highlight.endOffset > text.length || highlight.startOffset >= highlight.endOffset) {
        return;
      }

      if (highlight.startOffset > lastIndex) {
        parts.push(
          <span key={`text-${idx}`}>
            {text.substring(lastIndex, highlight.startOffset)}
          </span>
        );
      }

      parts.push(
        <span
          key={`highlight-${highlight.id}`}
          className="relative cursor-pointer px-[2px] mx-[0.5px] rounded-[3px] transition-all hover:opacity-80 active:scale-95"
          style={{
            backgroundColor: isDarkTheme ? '#F5E6E8' : (isMobile ? `${highlight.color}F0` : `${highlight.color}D9`),
            color: isDarkTheme ? '#5D1F27' : 'inherit',
            mixBlendMode: 'normal',
            boxDecorationBreak: 'clone',
            WebkitBoxDecorationBreak: 'clone',
            boxShadow: isMobile ? `0 1px 2px ${highlight.color}30` : 'none',
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            removeHighlight(highlight.id);
          }}
          onTouchStart={(e) => {
            const touchTimer = setTimeout(() => {
              e.stopPropagation();
              removeHighlight(highlight.id);
              if (typeof window !== 'undefined' && window.navigator && 'vibrate' in window.navigator) {
                try {
                  window.navigator.vibrate([50]);
                } catch (err) {
                  console.log('Vibration not supported');
                }
              }
            }, 500);
            
            const clearTimer = () => {
              clearTimeout(touchTimer);
              e.currentTarget.removeEventListener('touchend', clearTimer);
              e.currentTarget.removeEventListener('touchmove', clearTimer);
            };
            
            e.currentTarget.addEventListener('touchend', clearTimer);
            e.currentTarget.addEventListener('touchmove', clearTimer);
          }}
        >
          {text.substring(highlight.startOffset, highlight.endOffset)}
        </span>
      );

      lastIndex = highlight.endOffset;
    });

    if (lastIndex < text.length) {
      parts.push(
        <span key="text-end">
          {text.substring(lastIndex)}
        </span>
      );
    }

    return <>{parts}</>;
  };

  return (
    <div 
      className="w-full min-h-full flex flex-col relative"
      style={{ 
        backgroundColor: paperColor,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.015'/%3E%3C/svg%3E")`,
      }}
    >
      {/* 🎨 自定义文本选中颜色 */}
      <style jsx>{`
        ::selection {
          background-color: ${theme.id === 'daily' ? 'rgba(210, 180, 140, 0.4)' : 
                            theme.id === 'cognitive' ? 'rgba(168, 197, 221, 0.35)' : 
                            theme.id === 'business' ? 'rgba(232, 213, 216, 0.45)' : 
                            'rgba(210, 180, 140, 0.4)'};
          color: ${theme.id === 'business' ? '#2D0F15' : 'inherit'};
        }
        
        ::-moz-selection {
          background-color: ${theme.id === 'daily' ? 'rgba(210, 180, 140, 0.4)' : 
                            theme.id === 'cognitive' ? 'rgba(168, 197, 221, 0.35)' : 
                            theme.id === 'business' ? 'rgba(232, 213, 216, 0.45)' : 
                            'rgba(210, 180, 140, 0.4)'};
          color: ${theme.id === 'business' ? '#2D0F15' : 'inherit'};
        }
        
        ::-webkit-selection {
          background-color: ${theme.id === 'daily' ? 'rgba(210, 180, 140, 0.4)' : 
                            theme.id === 'cognitive' ? 'rgba(168, 197, 221, 0.35)' : 
                            theme.id === 'business' ? 'rgba(232, 213, 216, 0.45)' : 
                            'rgba(210, 180, 140, 0.4)'};
          color: ${theme.id === 'business' ? '#2D0F15' : 'inherit'};
        }
      `}</style>

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
              className="text-base md:text-xl leading-relaxed whitespace-pre-wrap"
              style={{ 
                color: color,
                fontWeight: 500,
                fontFamily: '"PingFang SC", -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                letterSpacing: '0.02em',
                lineHeight: '1.65',
                userSelect: 'text',
                WebkitUserSelect: 'text',
              }}
              onMouseUp={(e) => handleTextSelection('cn', recallText.cn, e)}
              onTouchEnd={(e) => {
                if (!isMobile) return;
                setTimeout(() => {
                  const selection = window.getSelection();
                  if (selection && !selection.isCollapsed) {
                    const selectedText = selection.toString().trim();
                    if (selectedText) {
                      const mockEvent = { currentTarget: e.currentTarget } as any;
                      handleTextSelection('cn', recallText.cn, mockEvent);
                    }
                  }
                }, 100);
              }}
            >
              {renderTextWithHighlights(recallText.cn, 'cn')}
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
            onMouseUp={(e) => {
              setIsRevealed(false);
              if (isRevealed) {
                handleTextSelection('en', recallText.en, e);
              }
            }}
            onMouseLeave={() => setIsRevealed(false)}
            onTouchStart={() => setIsRevealed(true)}
            onTouchEnd={(e) => {
              setIsRevealed(false);
              if (!isMobile) return;
              setTimeout(() => {
                const selection = window.getSelection();
                if (selection && !selection.isCollapsed) {
                  const selectedText = selection.toString().trim();
                  if (selectedText) {
                    const mockEvent = { currentTarget: e.currentTarget } as any;
                    handleTextSelection('en', recallText.en, mockEvent);
                  }
                }
              }, 100);
            }}
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
              className="text-sm md:text-xl leading-loose whitespace-pre-wrap"
              style={{ 
                color: color,
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
                fontWeight: 400,
                letterSpacing: '0.015em',
                lineHeight: '1.85',
                opacity: 0.9,
                userSelect: isRevealed ? 'text' : 'none',
                WebkitUserSelect: isRevealed ? 'text' : 'none',
              }}
            >
              {renderTextWithHighlights(recallText.en, 'en')}
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

      {/* 🎨 荧光笔调色盘 */}
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
            {highlightColors.map((color) => (
              <motion.button
                key={color.id}
                onClick={() => applyHighlight(color.color)}
                whileTap={{ scale: 0.9 }}
                className="w-5 h-5 md:w-6 md:h-6 rounded-full border-2 border-white transition-transform active:scale-90"
                style={{
                  backgroundColor: color.color,
                  boxShadow: `0 2px 6px ${color.color}60, 0 1px 2px rgba(0,0,0,0.05)`, 
                }}
                title={color.name}
              />
            ))}
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
