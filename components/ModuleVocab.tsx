"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Volume2, Bookmark, Check } from "lucide-react";
import type { VocabCard } from "@/data/types";
import { toggleNotebook, getNotebookByLesson } from "@/lib/notebook-store";

import type { ThemeConfig } from "@/lib/theme-config";

interface ModuleVocabProps {
  theme: ThemeConfig;
  vocab: VocabCard[];
  lessonId: string;
  category?: string;
}

export default function ModuleVocab({ theme, vocab, lessonId, category }: ModuleVocabProps) {
  const [cards, setCards] = useState(vocab);
  const [direction, setDirection] = useState(0);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [isFlipped, setIsFlipped] = useState(false); // 3D 翻转状态

  // 当 vocab 数据变化时重置
  useEffect(() => { 
    setCards(vocab); 
    setIsFlipped(false); // 重置翻转状态
  }, [vocab]);

  // 初始化：从 localStorage 读取已收藏的词汇
  useEffect(() => {
    const items = getNotebookByLesson(lessonId);
    const ids = new Set(
      items.filter(i => i.type === 'vocabulary').map(i => i.id)
    );
    setSavedIds(ids);
  }, [lessonId]);

  // --- 朗读 ---
  const handleSpeak = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.85;
    utterance.pitch = 1.0;
    
    // 确保语音列表已加载
    const setVoiceAndSpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      const premiumVoice = voices.find(v => 
        v.lang.startsWith('en') && (
          v.name.includes("Samantha") || 
          v.name.includes("Google") || 
          v.name.includes("Enhanced") ||
          v.name.includes("Premium")
        )
      );
      if (premiumVoice) {
        utterance.voice = premiumVoice;
      }
      window.speechSynthesis.speak(utterance);
    };

    // 如果语音列表还没加载，等待加载完成
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
      window.speechSynthesis.addEventListener('voiceschanged', setVoiceAndSpeak, { once: true });
    } else {
      setVoiceAndSpeak();
    }
  };

  const handleDragEnd = (_event: any, info: any) => {
    if (info.offset.x > 100) popCard();
    else if (info.offset.x < -100) reorderCard();
  };

  const popCard = () => {
    setCards((prev) => prev.slice(1));
    setIsFlipped(false); // 切换下一张时重置翻转状态
  };
  
  const reorderCard = () => {
    setCards((prev) => [...prev.slice(1), prev[0]]);
    setIsFlipped(false); // 切换下一张时重置翻转状态
  };

  const handleToggleSave = (card: VocabCard, e: React.MouseEvent) => {
    e.stopPropagation();
    const itemId = `${lessonId}-vocab-${card.id}`;
    const isNowSaved = toggleNotebook({
      id: itemId,
      lessonId,
      category,
      type: 'vocabulary',
      content: card.word,
      sub: card.phonetic,
      note: card.defCn || card.def, // 优先使用中文解释
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
    });
    setSavedIds(prev => {
      const next = new Set(prev);
      if (isNowSaved) next.add(itemId);
      else next.delete(itemId);
      return next;
    });
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-4 relative overflow-hidden">

      {/* 1. 顶部提示条 - 跟随卡片宽度 */}
      <div className="w-[85vw] max-w-[320px] mb-4 group relative h-6">
        <div className="flex justify-between items-center w-full px-1 transition-all duration-1000 ease-out opacity-0 blur-sm group-hover:opacity-40 group-hover:blur-0">
          <span className="text-[9px] uppercase tracking-[0.2em] italic" style={{ color: theme.text }}>← Unknown</span>
          <span className="text-[9px] uppercase tracking-[0.2em] italic" style={{ color: theme.text }}>Known →</span>
        </div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[1px] bg-current transition-all duration-1000 group-hover:w-full opacity-10" style={{ backgroundColor: theme.text }} />
      </div>

      {/* 2. 卡片容器 - 物理尺寸限制 + 灵活高度 */}
      <div 
        className="relative"
        style={{ 
          width: '85vw',           // 小屏友好
          maxWidth: '320px',       // 大屏精致锁定
          height: 'clamp(420px, 55dvh, 500px)', // 灵活适配不同屏幕
        }}
      >
        <AnimatePresence>
          {cards.length > 0 ? (
            cards.map((card, index) => {
              const isFirst = index === 0;
              const itemId = `${lessonId}-vocab-${card.id}`;
              const isSaved = savedIds.has(itemId);

              return (
                <div
                  key={card.id}
                  className="absolute inset-0"
                  style={{
                    zIndex: cards.length - index,
                    perspective: '1000px',
                  }}
                >
                  <motion.div
                    className="relative w-full h-full"
                    style={{
                      transformStyle: 'preserve-3d',
                    }}
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ 
                      scale: 1 - index * 0.05, 
                      opacity: 1 - index * 0.3, 
                      y: index * -15,
                      rotateY: isFirst && isFlipped ? 180 : 0,
                    }}
                    exit={{ x: direction > 0 ? 300 : -300, opacity: 0, rotate: direction > 0 ? 15 : -15 }}
                    transition={{ 
                      rotateY: { duration: 0.5, ease: 'easeInOut' },
                      default: { duration: 0.3 }
                    }}
                    drag={isFirst && !isFlipped ? "x" : false}
                    dragConstraints={{ left: 0, right: 0 }}
                    onDragStart={() => setDirection(0)}
                    onDrag={(_e, info) => setDirection(info.offset.x)}
                    onDragEnd={handleDragEnd}
                  >
                    {/* 正面：极简线索 */}
                    <motion.div
                      className="absolute inset-0 rounded-sm border shadow-2xl flex flex-col items-center justify-center cursor-pointer overflow-hidden"
                      style={{
                        backgroundColor: theme.bg,
                        color: theme.text,
                        borderColor: theme.lineColor,
                        backfaceVisibility: 'hidden',
                      }}
                      onClick={() => isFirst && setIsFlipped(true)}
                      whileHover={isFirst ? { scale: 1.02 } : {}}
                      whileTap={isFirst ? { scale: 0.98 } : {}}
                    >
                      {/* 做旧磨砂效果 */}
                      <div className="pointer-events-none absolute inset-0 opacity-[0.05] bg-noise mix-blend-multiply" />
                      <div className="pointer-events-none absolute inset-0 backdrop-blur-[0.5px] bg-orange-900/5 mix-blend-soft-light" />

                      {/* 中央单词 */}
                      <div className="flex flex-col items-center gap-2 px-4 w-full">
                        <h2 
                          className="text-3xl md:text-5xl tracking-tight font-sans font-normal text-center break-words w-full"
                          style={{ lineHeight: '1.1' }}
                        >
                          {card.word}
                        </h2>
                        <p className="font-sans opacity-40 text-xs md:text-sm">{card.phonetic}</p>
                      </div>

                      {/* 底部提示 */}
                      {isFirst && (
                        <motion.div 
                          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5"
                          animate={{ opacity: [0.2, 0.5, 0.2] }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        >
                          <div className="w-6 h-[1px] opacity-20" style={{ backgroundColor: theme.accent }} />
                          <span className="text-[8px] uppercase tracking-[0.2em] opacity-30">Tap</span>
                        </motion.div>
                      )}

                      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_40px_rgba(0,0,0,0.02)]" />
                    </motion.div>

                    {/* 背面：丰富内容 */}
                    <motion.div
                      className="absolute inset-0 rounded-sm border shadow-xl p-5 flex flex-col justify-between cursor-pointer overflow-hidden"
                      style={{
                        backgroundColor: theme.bg,
                        color: theme.text,
                        borderColor: theme.lineColor,
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                      }}
                      onClick={() => isFirst && setIsFlipped(false)}
                    >
                      {/* 做旧磨砂效果 */}
                      <div className="pointer-events-none absolute inset-0 opacity-[0.03] bg-noise mix-blend-multiply" />

                      <div className="relative z-10 flex flex-col h-full">
                        {/* Header */}
                        <div className="flex justify-end items-start mb-4 shrink-0">
                          <div className="flex gap-3">
                            {/* 收藏 */}
                            <button
                              onClick={(e) => handleToggleSave(card, e)}
                              className={`transition-all ${isSaved ? 'opacity-100' : 'opacity-20'}`}
                              style={{ color: isSaved ? theme.accent : theme.text }}
                            >
                              {isSaved ? <Check size={14} /> : <Bookmark size={14} />}
                            </button>
                            {/* 朗读 */}
                            <button
                              onClick={(e) => handleSpeak(card.word, e)}
                              className="opacity-20 active:opacity-100 transition-all"
                            >
                              <Volume2 size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 flex flex-col justify-center min-h-0">
                          <h2 className="text-2xl md:text-4xl tracking-tight mb-2 font-sans font-normal shrink-0">
                            {card.word}
                          </h2>
                          <div className="h-[1px] w-6 mb-3 opacity-20 shrink-0" style={{ backgroundColor: theme.text }} />
                          
                          {/* 限制文本高度，防止溢出 */}
                          <div className="overflow-y-auto pr-1 no-scrollbar">
                            <p className="text-sm md:text-base leading-relaxed opacity-80 font-sans mb-3">
                              {card.defCn || card.def}
                            </p>
                          </div>
                        </div>

                        {/* Footer Example */}
                        <div className="border-t pt-3 mt-2 shrink-0" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                          <p className="text-[11px] md:text-xs font-sans opacity-50 leading-relaxed italic line-clamp-3">
                            &quot;{card.ex}&quot;
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                </div>
              );
            })
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex flex-col items-center justify-center opacity-30">
              <p className="text-[9px] uppercase tracking-[0.3em] mb-4">Complete</p>
              <button onClick={() => { setCards(vocab); setIsFlipped(false); }} className="p-2 active:scale-95 transition-transform"><RotateCcw size={18} /></button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
