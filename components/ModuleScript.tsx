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

  // 🎨 自定义滑动"虚拟选区"状态（完全接管系统原生选择）
  const [isSelecting, setIsSelecting] = useState(false);
  const [previewSelection, setPreviewSelection] = useState<{
    lineId: number;
    startOffset: number;
    endOffset: number;
  } | null>(null);
  
  // 记录滑动的起点字符位置
  const swipeStartOffsetRef = useRef<number | null>(null);

  // 🎨 移动端滑动选择状态（基于 word-index）
  const [swipeStartWordIndex, setSwipeStartWordIndex] = useState<{ lineId: number; wordIndex: number } | null>(null);
  const [swipeCurrentWordIndex, setSwipeCurrentWordIndex] = useState<number | null>(null);

  // 🎯 将文本按空格拆分成单词数组（保留标点符号）
  const tokenizeWords = useCallback((text: string): string[] => {
    // 按空格拆分，保留所有字符（包括标点）
    return text.split(/(\s+)/).filter(token => token.length > 0);
  }, []);

  // 🎯 获取触摸点对应的 word-index
  const getWordIndexFromTouch = useCallback((touch: React.Touch): { lineId: number; wordIndex: number } | null => {
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!element) return null;

    // 查找最近的带有 data-word-index 的元素
    const wordSpan = element.closest('[data-word-index]') as HTMLElement;
    if (!wordSpan) return null;

    const wordIndex = parseInt(wordSpan.getAttribute('data-word-index') || '-1', 10);
    const lineId = parseInt(wordSpan.getAttribute('data-line-id') || '-1', 10);

    if (wordIndex < 0 || lineId < 0) return null;

    return { lineId, wordIndex };
  }, []);

  // 🎨 移动端触摸开始
  const handleTouchStart = useCallback((e: React.TouchEvent, lineId: number) => {
    if (!isMobile) return;
    
    const touch = e.touches[0];
    const wordInfo = getWordIndexFromTouch(touch);
    
    if (wordInfo && wordInfo.lineId === lineId) {
      setSwipeStartWordIndex(wordInfo);
      setSwipeCurrentWordIndex(wordInfo.wordIndex);
      setIsSelecting(true);
      
      // 轻微震动反馈
      if (window.navigator && 'vibrate' in window.navigator) {
        try {
          window.navigator.vibrate([5]);
        } catch (err) {
          // Vibration not supported
        }
      }
    }
  }, [isMobile, getWordIndexFromTouch]);

  // 🎨 移动端触摸移动
  const handleTouchMove = useCallback((e: React.TouchEvent, lineId: number) => {
    if (!isMobile || !swipeStartWordIndex || swipeStartWordIndex.lineId !== lineId) return;
    
    // 阻止默认滚动行为
    e.preventDefault();
    
    const touch = e.touches[0];
    const wordInfo = getWordIndexFromTouch(touch);
    
    if (wordInfo && wordInfo.lineId === lineId && wordInfo.wordIndex !== swipeCurrentWordIndex) {
      setSwipeCurrentWordIndex(wordInfo.wordIndex);
      
      // 更新预览选区（基于 word-index 范围）
      const startIndex = Math.min(swipeStartWordIndex.wordIndex, wordInfo.wordIndex);
      const endIndex = Math.max(swipeStartWordIndex.wordIndex, wordInfo.wordIndex);
      
      setPreviewSelection({
        lineId,
        startOffset: startIndex,
        endOffset: endIndex + 1, // endOffset 是开区间
      });
    }
  }, [isMobile, swipeStartWordIndex, swipeCurrentWordIndex, getWordIndexFromTouch]);

  // 🎨 移动端触摸结束
  const handleTouchEnd = useCallback((e: React.TouchEvent, lineId: number, words: string[]) => {
    if (!isMobile || !swipeStartWordIndex) {
      setSwipeStartWordIndex(null);
      setSwipeCurrentWordIndex(null);
      setIsSelecting(false);
      setPreviewSelection(null);
      return;
    }
    
    // 🎯 如果没有预览选区，说明用户只是点击而不是滑动
    if (!previewSelection) {
      setSwipeStartWordIndex(null);
      setSwipeCurrentWordIndex(null);
      setIsSelecting(false);
      return;
    }
    
    // 🎯 提取选中的单词（过滤空格）
    const selectedWords = words
      .slice(previewSelection.startOffset, previewSelection.endOffset)
      .filter(w => w.trim().length > 0);
    const selectedText = selectedWords.join(' ').trim();
    
    // 🎯 只有选中的文本长度 > 0 才继续
    if (selectedText.length > 0) {
      
      // 🚨 【核心新增】：神级交互 —— 检查这次滑动是否碰到了已有的高亮？
      // 用数学公式 (Math.max < Math.min) 精准判断两个区间是否有重叠
      const overlappingHighlight = highlights.find(h => 
        h.lineId === lineId && 
        Math.max(h.startOffset, previewSelection.startOffset) < Math.min(h.endOffset, previewSelection.endOffset)
      );

      // 如果碰到了已有高亮 -> 触发"滑动橡皮擦"，直接删掉，不弹面板！
      if (overlappingHighlight) {
        // 删除该高亮
        removeHighlight(overlappingHighlight.id);
        
        // 专属的"擦除"震动反馈 (哒-哒 两下)
        if (window.navigator && 'vibrate' in window.navigator) {
          try { 
            window.navigator.vibrate([15, 40, 15]); 
          } catch (err) {
            // Vibration not supported
          }
        }

        // 清理状态，直接退出
        setSwipeStartWordIndex(null);
        setSwipeCurrentWordIndex(null);
        setIsSelecting(false);
        setPreviewSelection(null);
        return; // 🚨 极其关键：拦截后续的调色盘弹出逻辑
      }

      // 🎨 如果没有碰到已有高亮，说明是全新的划线 -> 正常计算位置并弹出调色盘
      const touch = e.changedTouches[0];
      const pickerWidth = 140;
      const pickerHeight = 36;
      const viewportWidth = window.innerWidth;
      
      let finalX = touch.clientX - pickerWidth / 2;
      let finalY = touch.clientY - pickerHeight - 12;
      
      if (finalX < 8) finalX = 8;
      if (finalX + pickerWidth > viewportWidth - 8) {
        finalX = viewportWidth - pickerWidth - 8;
      }
      if (finalY < 8) {
        finalY = touch.clientY + 12;
      }
      
      setColorPickerPosition({ x: finalX, y: finalY });
      setSelectedRange({
        text: selectedText,
        lineId,
        startOffset: previewSelection.startOffset,
        endOffset: previewSelection.endOffset,
      });
      
      setShowColorPicker(true);
      
      // 成功划线的单次震动反馈
      if (window.navigator && 'vibrate' in window.navigator) {
        try {
          window.navigator.vibrate([10]);
        } catch (err) {
          // Vibration not supported
        }
      }
    }
    
    // 🎯 清理滑动状态，但保留 previewSelection（用于显示预览）
    setSwipeStartWordIndex(null);
    setSwipeCurrentWordIndex(null);
    setIsSelecting(false);
    // 不清除 previewSelection，让用户看到选中效果
  }, [isMobile, swipeStartWordIndex, previewSelection]);

  // 🖱️ 桌面端：鼠标按下 (相当于 TouchStart)
  const handleMouseDown = useCallback((lineId: number, index: number) => {
    if (isMobile) return; // 手机端不理会鼠标事件
    setSwipeStartWordIndex({ lineId, wordIndex: index });
    setSwipeCurrentWordIndex(index);
    setIsSelecting(true);
  }, [isMobile]);

  // 🖱️ 桌面端：鼠标划过其他单词 (相当于 TouchMove)
  const handleMouseEnter = useCallback((e: React.MouseEvent, lineId: number, index: number) => {
    if (isMobile || !swipeStartWordIndex || swipeStartWordIndex.lineId !== lineId) return;
    
    // 🚨 必须检查鼠标左键是否一直按着 (e.buttons === 1 表示左键按下)
    if (e.buttons !== 1) {
      return; 
    }

    if (index !== swipeCurrentWordIndex) {
      setSwipeCurrentWordIndex(index);
      const startIndex = Math.min(swipeStartWordIndex.wordIndex, index);
      const endIndex = Math.max(swipeStartWordIndex.wordIndex, index);
      
      setPreviewSelection({
        lineId,
        startOffset: startIndex,
        endOffset: endIndex + 1,
      });
    }
  }, [isMobile, swipeStartWordIndex, swipeCurrentWordIndex]);

  // 🖱️ 桌面端：鼠标松开 (相当于 TouchEnd)
  const handleMouseUp = useCallback((lineId: number, words: string[]) => {
    if (isMobile || !swipeStartWordIndex) {
      setSwipeStartWordIndex(null);
      setSwipeCurrentWordIndex(null);
      setIsSelecting(false);
      setPreviewSelection(null);
      return;
    }
    
    if (!previewSelection) {
      setSwipeStartWordIndex(null);
      setSwipeCurrentWordIndex(null);
      setIsSelecting(false);
      return;
    }

    const selectedWords = words
      .slice(previewSelection.startOffset, previewSelection.endOffset)
      .filter(w => w.trim().length > 0);
    const selectedText = selectedWords.join(' ').trim();

    if (selectedText.length > 0) {
      // 桌面端调色盘位置：使用鼠标当前位置
      const pickerWidth = 180;
      const pickerHeight = 40;
      const viewportWidth = window.innerWidth;
      
      // 获取鼠标位置（从最后一次 mouseenter 事件）
      let finalX = window.event ? (window.event as MouseEvent).clientX - pickerWidth / 2 : 100;
      let finalY = window.event ? (window.event as MouseEvent).clientY - pickerHeight - 12 : 100;
      
      if (finalX < 8) finalX = 8;
      if (finalX + pickerWidth > viewportWidth - 8) {
        finalX = viewportWidth - pickerWidth - 8;
      }
      if (finalY < 8) {
        finalY = window.event ? (window.event as MouseEvent).clientY + 12 : 100;
      }
      
      setColorPickerPosition({ x: finalX, y: finalY });
      setSelectedRange({
        text: selectedText,
        lineId,
        startOffset: previewSelection.startOffset,
        endOffset: previewSelection.endOffset,
      });
      
      setShowColorPicker(true);
    }
    
    setSwipeStartWordIndex(null);
    setSwipeCurrentWordIndex(null);
    setIsSelecting(false);
  }, [isMobile, swipeStartWordIndex, previewSelection]);

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
      const parsed = JSON.parse(savedHighlights);
      setHighlights(parsed);
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

    // 🎯 提前1秒滚动：判断即将播放的字幕
    const activeIndex = transcript.findIndex(
      (line) => currentTime >= (line.start - 1) && currentTime <= line.end
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
        // Vibration not supported
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

  // 🎨 删除荧光笔（带擦除触觉反馈）
  const removeHighlight = useCallback((highlightId: string) => {
    const newHighlights = highlights.filter(h => h.id !== highlightId);
    setHighlights(newHighlights);
    localStorage.setItem(`highlights_${lessonId}`, JSON.stringify(newHighlights));
    
    // 擦除时的专属触觉反馈（低频震动，类似擦除黑板）
    if (typeof window !== 'undefined' && window.navigator && 'vibrate' in window.navigator) {
      try {
        window.navigator.vibrate([15, 30, 15]);
      } catch (e) {
        // Vibration not supported
      }
    }
  }, [highlights, lessonId]);

  // 🎨 应用荧光笔颜色（基于 word-index，支持换色和同色抵消）
  const applyHighlight = useCallback((color: string) => {
    if (!selectedRange) {
      return;
    }

    // 🎨 检查是否是在修改已有高亮（换色或橡皮擦）
    const existingHighlight = highlights.find(h => 
      h.lineId === selectedRange.lineId && 
      h.startOffset === selectedRange.startOffset &&
      h.endOffset === selectedRange.endOffset
    );

    if (existingHighlight) {
      if (existingHighlight.color === color) {
        // 🚨 触发了"同色抵消"神级交互！直接删除！
        removeHighlight(existingHighlight.id);
        setShowColorPicker(false);
        setSelectedRange(null);
        setPreviewSelection(null);
        
        // 擦除时的专属触觉反馈（低频震动）
        if (typeof window !== 'undefined' && window.navigator && 'vibrate' in window.navigator) {
          try {
            window.navigator.vibrate([15, 30, 15]); // 擦除黑板的质感
          } catch (e) {
            // Vibration not supported
          }
        }
        return;
      } else {
        // 换色：更新颜色
        const newHighlights = highlights.map(h => 
          h.id === existingHighlight.id 
            ? { ...h, color } 
            : h
        );
        setHighlights(newHighlights);
        localStorage.setItem(`highlights_${lessonId}`, JSON.stringify(newHighlights));
      }
    } else {
      // 🛡️ 防御性检查：拦截与已有高亮重叠的选区（但不是完全相同的）
      const hasOverlap = highlights.some(h => 
        h.lineId === selectedRange.lineId && 
        !(selectedRange.endOffset <= h.startOffset || selectedRange.startOffset >= h.endOffset)
      );

      if (hasOverlap) {
        // 重叠时：关闭调色盘，轻震动提示
        setShowColorPicker(false);
        setSelectedRange(null);
        setPreviewSelection(null); // 清除预览
        
        // 轻微的"拒绝"震动反馈（两次短促震动）
        if (typeof window !== 'undefined' && window.navigator && 'vibrate' in window.navigator) {
          try {
            window.navigator.vibrate([15, 30, 15]);
          } catch (e) {
            // Vibration not supported
          }
        }
        return;
      }

      // 新建高亮
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
    }

    // 清除选择和预览
    setShowColorPicker(false);
    setSelectedRange(null);
    setPreviewSelection(null); // 清除预览

    // 成功的震动反馈
    if (typeof window !== 'undefined' && window.navigator && 'vibrate' in window.navigator) {
      try {
        window.navigator.vibrate([20]);
      } catch (e) {
        // Vibration not supported
      }
    }
  }, [selectedRange, highlights, lessonId, removeHighlight]);

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

  // 🆕 处理字幕点击播放 (修复选区冲突)
  const handleLineClick = useCallback((time: number) => {
    // 🚨 移动端滑动选择时，拦截点击
    if (isMobile && isSelecting) {
      return; 
    }
    
    // 如果没有选中文本（纯点击），才执行视频跳转
    onSeek(time);
    setIsPlaying(true);
  }, [onSeek, setIsPlaying, isMobile, isSelecting]);

  // 🎨 获取主题对应的阴影颜色
  const getThemeShadowColor = useCallback(() => {
    switch (theme.id) {
      case 'daily':
        return 'rgba(210, 180, 140, 0.4)'; // 奶茶色阴影
      case 'cognitive':
        return 'rgba(120, 150, 180, 0.35)'; // 灰蓝色阴影
      case 'business':
        return 'rgba(255, 192, 203, 0.3)'; // 浅粉色阴影
      default:
        return 'rgba(0, 0, 0, 0.15)';
    }
  }, [theme.id]);

  // 🎨 获取预览背景色（根据主题）
  const getPreviewBackgroundColor = useCallback(() => {
    switch (theme.id) {
      case 'daily':
        return 'rgba(210, 180, 140, 0.5)'; // 奶茶色背景
      case 'cognitive':
        return 'rgba(120, 150, 180, 0.45)'; // 灰蓝色背景
      case 'business':
        return 'rgba(255, 192, 203, 0.4)'; // 浅粉色背景
      default:
        return 'rgba(255, 234, 40, 0.5)'; // 默认黄色
    }
  }, [theme.id]);

  // 🎨 渲染带荧光笔效果的文本（按词渲染 Span）
  const renderTextWithHighlights = (text: string, lineId: number) => {
    const words = tokenizeWords(text);
    const lineHighlights = highlights.filter(h => h.lineId === lineId);
    const isPreviewingThisLine = previewSelection && previewSelection.lineId === lineId;
    
    // 判断是否为深色主题
    const isDarkTheme = theme.id === 'business';
    const themeShadowColor = getThemeShadowColor();
    const previewBgColor = getPreviewBackgroundColor();

    return (
      <>
        {words.map((word, wordIndex) => {
          // 判断当前单词是否在预览选区内
          const isInPreview = isPreviewingThisLine && 
            wordIndex >= previewSelection.startOffset && 
            wordIndex < previewSelection.endOffset;

          // 判断当前单词是否在已保存的高亮内
          const matchedHighlight = lineHighlights.find(h => 
            wordIndex >= h.startOffset && wordIndex < h.endOffset
          );

          // ✅ 正确：空格也是积木！必须加上 index，否则滑动到空格处会断掉
          if (word.trim().length === 0) {
            return (
              <span 
                key={`space-${lineId}-${wordIndex}`} 
                data-word-index={wordIndex}
                data-line-id={lineId}
              >
                {word}
              </span>
            );
          }

          // 确定背景色和样式
          let backgroundColor = 'transparent';
          let boxShadow = 'none';
          let isHighlighted = false;

          if (isInPreview) {
            backgroundColor = previewBgColor;
            boxShadow = `0 2px 6px ${themeShadowColor}, 0 1px 3px ${themeShadowColor}`;
            isHighlighted = true;
          } else if (matchedHighlight) {
            backgroundColor = isDarkTheme 
              ? '#F5E6E8' 
              : (isMobile ? `${matchedHighlight.color}F0` : `${matchedHighlight.color}D9`);
            boxShadow = isDarkTheme 
              ? '0 1px 3px rgba(93, 31, 39, 0.25)'
              : (theme.id === 'daily' 
                  ? `0 1px 3px ${matchedHighlight.color}40, 0 0.5px 1.5px ${matchedHighlight.color}30`
                  : (theme.id === 'cognitive'
                      ? `0 1px 3px ${matchedHighlight.color}35, 0 0.5px 1px rgba(0,0,0,0.08)`
                      : `0 1px 3px ${matchedHighlight.color}40`
                    )
                );
            isHighlighted = true;
          }

          // 🚨 核心新增：判断当前词是不是高亮块的"头"或"尾"
          let isStart = false;
          let isEnd = false;

          if (matchedHighlight) {
            isStart = wordIndex === matchedHighlight.startOffset;
            isEnd = wordIndex === (matchedHighlight.endOffset - 1); // 因为 endOffset 是开区间
          } else if (isInPreview) {
            isStart = wordIndex === previewSelection.startOffset;
            isEnd = wordIndex === (previewSelection.endOffset - 1);
          }

          const radius = (isStart && isEnd) ? '4px' : 
                         isStart ? '4px 0 0 4px' :   
                         isEnd ? '0 4px 4px 0' :     
                         '0';

          // 🚨 核弹解法：计算背景层的溢出量
          // 如果不是开头，就疯狂向左溢出 4px；如果不是结尾，就疯狂向右溢出 4px。
          // 这 8px 的巨大重叠区，神仙来了也挡不住缝隙！
          const bleedLeft = isStart ? '0' : '-4px';
          const bleedRight = isEnd ? '0' : '-4px';

          return (
            <span
              key={`word-${lineId}-${wordIndex}`}
              data-word-index={wordIndex}
              data-line-id={lineId}
              // 🚨 外层容器：负责占位、监听事件，但绝不负责显色！
              className={`relative inline-block transition-all ${isHighlighted ? 'cursor-pointer' : ''}`}
              style={{
                // 这里不再设置 backgroundColor！
                // 只需要一点点 margin 来抵消巨大的溢出，防止文字重叠
                margin: isHighlighted ? `0 ${isEnd ? '0' : '-2px'} 0 ${isStart ? '0' : '-2px'}` : '0',
                padding: isHighlighted ? '1px 3px' : '0', // 上下各1px，左右给文字呼吸空间
                
                opacity: isInPreview ? 0.8 : 1,
                verticalAlign: 'baseline',
                // 强制 GPU 加速，稳定渲染层
                transform: 'translateZ(0)',
                zIndex: 0, // 基准层级
              }}
              // 🖱️ 桌面端鼠标事件
              onMouseDown={() => !isMobile && handleMouseDown(lineId, wordIndex)}
              onMouseEnter={(e) => !isMobile && handleMouseEnter(e, lineId, wordIndex)}
              onClick={(e) => {
                if (matchedHighlight && !isInPreview) {
                  e.stopPropagation(); // 阻止播放视频
                  
                  // 再次唤出调色盘，把当前高亮的数据传给 selectedRange
                  setSelectedRange({
                    text: matchedHighlight.text,
                    lineId: matchedHighlight.lineId,
                    startOffset: matchedHighlight.startOffset,
                    endOffset: matchedHighlight.endOffset,
                  });
                  
                  // 算出位置并在原地弹出
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pickerWidth = 180; // 调色盘宽度（包含删除按钮后会更宽）
                  const pickerHeight = 40;
                  const viewportWidth = window.innerWidth;
                  
                  let finalX = rect.left + rect.width / 2 - pickerWidth / 2;
                  let finalY = rect.top - pickerHeight - 12;
                  
                  // 边界检查
                  if (finalX < 8) finalX = 8;
                  if (finalX + pickerWidth > viewportWidth - 8) {
                    finalX = viewportWidth - pickerWidth - 8;
                  }
                  if (finalY < 8) {
                    finalY = rect.bottom + 12;
                  }
                  
                  setColorPickerPosition({ x: finalX, y: finalY });
                  setShowColorPicker(true);
                  
                  if (window.navigator && 'vibrate' in window.navigator) {
                    try {
                      window.navigator.vibrate([10]);
                    } catch (err) {
                      // Vibration not supported
                    }
                  }
                }
              }}
              onDoubleClick={(e) => {
                // 🖱️ 桌面端双击秒删
                if (!isMobile && matchedHighlight && !isInPreview) {
                  e.stopPropagation();
                  removeHighlight(matchedHighlight.id);
                }
              }}
            >
              {/* 🎨 核心：独立的绝对定位背景层 */}
              {isHighlighted && (
                <span 
                  style={{
                    position: 'absolute',
                    backgroundColor, // 颜色在这里渲染！
                    top: 0,
                    bottom: 0,
                    // 🚨 巨大的物理重叠：向左右疯狂溢出
                    left: bleedLeft,
                    right: bleedRight,
                    // 只有头尾才需要圆角
                    borderRadius: radius,
                    // 放在文字下层
                    zIndex: -1,
                  }}
                />
              )}
              
              {/* 📝 文字层：干干净净，只负责显示文字 */}
              <span 
                style={{ 
                  position: 'relative', 
                  zIndex: 1,
                  color: isDarkTheme && isHighlighted ? '#5D1F27' : 'inherit',
                }}
              >
                {word}
              </span>
            </span>
          );
        })}
      </>
    );
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
        // 荧光淡红棕色 - 焦糖红茶色（极低饱和度版本）
        return '#FFF0E8';
      case 'cognitive':
        // 荧光淡蓝色 - 更浅的荧光蓝
        return '#E5F6FF';
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
              className={`font-medium tracking-tight transition-all duration-300 ${
                isActive ? 'text-[19px] md:text-[23px]' : 'text-[18px] md:text-[22px]'
              }`}
              style={{
                color: isSaved && !isActive ? savedStyle.color : getTextColor(),
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", system-ui, sans-serif',
                lineHeight: '1.2',
                // 🎯 移动端完全禁用原生选择，桌面端保留原生选择
                userSelect: isMobile ? 'none' : 'text',
                WebkitUserSelect: isMobile ? 'none' : 'text',
                WebkitTouchCallout: isMobile ? 'none' : 'default',
                // 如果正在滑动选择，锁死垂直滚动；否则允许滚动
                touchAction: isSelecting ? 'none' : 'pan-y',
              }}
              onClick={(e) => e.stopPropagation()}
              onTouchStart={(e) => isMobile && handleTouchStart(e, line.id)}
              onTouchMove={(e) => isMobile && handleTouchMove(e, line.id)}
              onTouchEnd={(e) => {
                if (isMobile) {
                  const words = tokenizeWords(line.en);
                  handleTouchEnd(e, line.id, words);
                }
              }}
              onMouseUp={() => {
                if (!isMobile) {
                  const words = tokenizeWords(line.en);
                  handleMouseUp(line.id, words);
                }
              }}
              onMouseLeave={() => {
                if (!isMobile && isSelecting) {
                  setSwipeStartWordIndex(null);
                  setSwipeCurrentWordIndex(null);
                  setIsSelecting(false);
                  setPreviewSelection(null);
                }
              }}
            >
              {renderTextWithHighlights(line.en, line.id)}
            </p>
          )}

          {/* 纯中文模式 - 缩小1号 + 调浅 + 移动端缩小1号 */}
          {langMode === 'cn' && (
            <p 
              className={`transition-all duration-300 ${
                isActive ? 'text-[20px] md:text-[23px]' : 'text-[19px] md:text-[22px]'
              }`}
              style={{
                color: isSaved && !isActive ? savedStyle.color : getTextColor(),
                opacity: 0.75,
                fontFamily: '"PingFang SC", -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", "Microsoft YaHei", sans-serif',
                lineHeight: '1.2',
                // 🎯 移动端完全禁用原生选择，桌面端保留原生选择
                userSelect: isMobile ? 'none' : 'text',
                WebkitUserSelect: isMobile ? 'none' : 'text',
                WebkitTouchCallout: isMobile ? 'none' : 'default',
                // 如果正在滑动选择，锁死垂直滚动；否则允许滚动
                touchAction: isSelecting ? 'none' : 'pan-y',
              }}
              onClick={(e) => e.stopPropagation()}
              onTouchStart={(e) => isMobile && handleTouchStart(e, line.id + 10000)}
              onTouchMove={(e) => isMobile && handleTouchMove(e, line.id + 10000)}
              onTouchEnd={(e) => {
                if (isMobile) {
                  const words = tokenizeWords(line.cn);
                  handleTouchEnd(e, line.id + 10000, words);
                }
              }}
              onMouseUp={() => {
                if (!isMobile) {
                  const words = tokenizeWords(line.cn);
                  handleMouseUp(line.id + 10000, words);
                }
              }}
              onMouseLeave={() => {
                if (!isMobile && isSelecting) {
                  setSwipeStartWordIndex(null);
                  setSwipeCurrentWordIndex(null);
                  setIsSelecting(false);
                  setPreviewSelection(null);
                }
              }}
            >
              {renderTextWithHighlights(line.cn, line.id + 10000)}
            </p>
          )}

          {/* 双语模式下的中文 - 缩小1号 + 调浅 + 移动端缩小1号 */}
          {langMode === 'bi' && (
            <p 
              className={`transition-all duration-300 ${
                isActive ? 'text-[16px] md:text-[19px]' : 'text-[15px] md:text-[18px]'
              }`}
              style={{ 
                letterSpacing: '0.01em',
                color: isSaved && !isActive ? savedStyle.color : getTextColor(),
                opacity: 0.75,
                fontFamily: '"PingFang SC", -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", "Microsoft YaHei", sans-serif',
                lineHeight: '1.2',
                // 🎯 移动端完全禁用原生选择，桌面端保留原生选择
                userSelect: isMobile ? 'none' : 'text',
                WebkitUserSelect: isMobile ? 'none' : 'text',
                WebkitTouchCallout: isMobile ? 'none' : 'default',
                // 如果正在滑动选择，锁死垂直滚动；否则允许滚动
                touchAction: isSelecting ? 'none' : 'pan-y',
              }}
              onClick={(e) => e.stopPropagation()}
              onTouchStart={(e) => isMobile && handleTouchStart(e, line.id + 10000)}
              onTouchMove={(e) => isMobile && handleTouchMove(e, line.id + 10000)}
              onTouchEnd={(e) => {
                if (isMobile) {
                  const words = tokenizeWords(line.cn);
                  handleTouchEnd(e, line.id + 10000, words);
                }
              }}
              onMouseUp={() => {
                if (!isMobile) {
                  const words = tokenizeWords(line.cn);
                  handleMouseUp(line.id + 10000, words);
                }
              }}
              onMouseLeave={() => {
                if (!isMobile && isSelecting) {
                  setSwipeStartWordIndex(null);
                  setSwipeCurrentWordIndex(null);
                  setIsSelecting(false);
                  setPreviewSelection(null);
                }
              }}
            >
              {renderTextWithHighlights(line.cn, line.id + 10000)}
            </p>
          )}

          {/* 底部：操作图标 - 独占一行，不与字幕重叠 */}
          <div className="flex items-center justify-between -mt-1">
            {/* 左侧：时间轴 - 放大1.2倍 */}
            <span 
              className={`font-mono opacity-40 ${isMobile ? 'text-[9.6px]' : 'text-[14.4px]'}`}
              style={{ 
                color: theme.text,
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Mono", "Menlo", monospace',
                marginLeft: isMobile ? '0' : '0.2rem'
              }}
            >
              {formatTime(line.start)}
            </span>

            {/* 右侧：操作图标 - 放大1.2倍 */}
            <div className={`flex items-center opacity-50 group-hover:opacity-100 transition-opacity ${isMobile ? 'gap-2' : 'gap-4'}`}>
              {/* 播放 */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={(e) => { e.stopPropagation(); handleLineClick(line.start); }}
                className="hover:opacity-70 transition-opacity"
                style={{ color: theme.text }}
                title="播放"
              >
                <svg width={isMobile ? "12" : "16.8"} height={isMobile ? "12" : "16.8"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                  <svg width={isMobile ? "12" : "16.8"} height={isMobile ? "12" : "16.8"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : (
                  <Copy size={isMobile ? 12 : 16.8} />
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
                <Star size={isMobile ? 12 : 16.8} fill={isSaved ? theme.accent : 'none'} />
              </motion.button>

              {/* 笔记 */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={(e) => handleNoteToggle(line.id, e)}
                className="hover:opacity-70 transition-opacity"
                style={{ color: hasNote || isEditingNote ? theme.accent : theme.text }}
                title="笔记"
              >
                <Edit3 size={isMobile ? 12 : 16.8} />
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
    <div 
      className="flex-1 w-full h-full flex flex-col relative overflow-hidden"
      style={{
        // 🚨 移动端禁用水平滑动（防止触发浏览器返回手势）
        touchAction: isMobile ? 'pan-y' : 'auto',
      }}
    >

      {/* 字幕流 */}
      <div
        ref={scrollContainerRef}
        onScroll={handleUserScroll}
        onTouchStart={handleUserTouch}
        // 右侧边距改为 0，让内容容器的 pr-[0.8rem] 统一控制
        className="flex-1 w-full max-w-[1600px] mx-auto overflow-y-auto pl-2 pr-0 md:pl-4 md:pr-0 pb-36 md:pb-48 no-scrollbar"
        style={{
          // 🚨 移动端只允许垂直滚动，禁用水平滑动
          touchAction: isMobile ? 'pan-y' : 'auto',
        }}
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
            {/* 颜色按钮组 */}
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
            
            {/* 🚨 新增：垃圾桶删除按钮（当点击已有高亮时显示） */}
            {selectedRange && highlights.some(h => 
              h.lineId === selectedRange.lineId && 
              h.startOffset === selectedRange.startOffset &&
              h.endOffset === selectedRange.endOffset
            ) && (
              <>
                <div className="w-px h-4 md:h-5 bg-black/10" /> {/* 分割线 */}
                <motion.button
                  onClick={() => {
                    // 找到对应的 highlight 并删除
                    const target = highlights.find(h => 
                      h.lineId === selectedRange.lineId && 
                      h.startOffset === selectedRange.startOffset &&
                      h.endOffset === selectedRange.endOffset
                    );
                    if (target) {
                      removeHighlight(target.id);
                      setShowColorPicker(false);
                      setSelectedRange(null);
                      setPreviewSelection(null);
                    }
                  }}
                  whileTap={{ scale: 0.85 }}
                  className="w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-full text-red-500 bg-red-50 transition-transform active:scale-90"
                  title="删除高亮"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                  </svg>
                </motion.button>
              </>
            )}
            
            {/* 🎯 关闭按钮同步缩小 */}
            <motion.button
              onClick={() => {
                setShowColorPicker(false);
                setSelectedRange(null);
                setPreviewSelection(null);
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
