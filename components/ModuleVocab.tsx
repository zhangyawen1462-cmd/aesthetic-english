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
}

export default function ModuleVocab({ theme, vocab, lessonId }: ModuleVocabProps) {
  const [cards, setCards] = useState(vocab);
  const [direction, setDirection] = useState(0);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  // 当 vocab 数据变化时重置
  useEffect(() => { setCards(vocab); }, [vocab]);

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
    const voices = window.speechSynthesis.getVoices();
    const premiumVoice = voices.find(v => v.name.includes("Samantha") || v.name.includes("Google US English"));
    if (premiumVoice) utterance.voice = premiumVoice;
    window.speechSynthesis.speak(utterance);
  };

  const handleDragEnd = (_event: any, info: any) => {
    if (info.offset.x > 100) popCard();
    else if (info.offset.x < -100) reorderCard();
  };

  const popCard = () => setCards((prev) => prev.slice(1));
  const reorderCard = () => setCards((prev) => [...prev.slice(1), prev[0]]);

  const handleToggleSave = (card: VocabCard, e: React.MouseEvent) => {
    e.stopPropagation();
    const itemId = `${lessonId}-vocab-${card.id}`;
    const isNowSaved = toggleNotebook({
      id: itemId,
      lessonId,
      type: 'vocabulary',
      content: card.word,
      sub: card.phonetic,
      note: card.def,
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
    <div className="h-full flex flex-col items-center justify-center p-6 relative overflow-hidden">

      {/* 1. 悬停提示 */}
      <div className="w-full max-w-[400px] mb-8 group relative h-6">
        <div className="flex justify-between items-center w-full px-2 transition-all duration-1000 ease-out opacity-0 blur-sm group-hover:opacity-40 group-hover:blur-0">
          <span className="text-[9px] uppercase tracking-[0.3em] italic" style={{ color: theme.text }}>← Unknown / Reappear</span>
          <span className="text-[9px] uppercase tracking-[0.3em] italic" style={{ color: theme.text }}>Mastered / Known →</span>
        </div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[1px] bg-current transition-all duration-1000 group-hover:w-full opacity-10" style={{ backgroundColor: theme.text }} />
      </div>

      {/* 2. 卡片堆叠 */}
      <div className="relative w-full max-w-[400px] h-[500px]">
        <AnimatePresence>
          {cards.length > 0 ? (
            cards.map((card, index) => {
              const isFirst = index === 0;
              const itemId = `${lessonId}-vocab-${card.id}`;
              const isSaved = savedIds.has(itemId);

              return (
                <motion.div
                  key={card.id}
                  style={{
                    zIndex: cards.length - index,
                    backgroundColor: theme.bg,
                    color: theme.text,
                    borderColor: theme.lineColor,
                  }}
                  className="absolute inset-0 rounded-sm border shadow-2xl p-10 flex flex-col justify-between cursor-grab active:cursor-grabbing overflow-hidden"
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1 - index * 0.05, opacity: 1 - index * 0.3, y: index * -15 }}
                  exit={{ x: direction > 0 ? 500 : -500, opacity: 0, rotate: direction > 0 ? 20 : -20 }}
                  drag={isFirst ? "x" : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  onDragStart={() => setDirection(0)}
                  onDrag={(_e, info) => setDirection(info.offset.x)}
                  onDragEnd={handleDragEnd}
                >
                  {/* 做旧磨砂效果 */}
                  <div className="pointer-events-none absolute inset-0 opacity-[0.05] bg-noise mix-blend-multiply" />
                  <div className="pointer-events-none absolute inset-0 backdrop-blur-[0.5px] bg-orange-900/5 mix-blend-soft-light" />

                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <span className="text-[10px] font-mono opacity-30">#0{card.id}</span>
                      <div className="flex gap-4">
                        {/* 收藏 */}
                        <button
                          onClick={(e) => handleToggleSave(card, e)}
                          className={`transition-all duration-500 hover:scale-110 ${isSaved ? 'opacity-100' : 'opacity-20 hover:opacity-60'}`}
                          style={{ color: isSaved ? theme.accent : theme.text }}
                        >
                          {isSaved ? <Check size={16} /> : <Bookmark size={16} />}
                        </button>
                        {/* 朗读 */}
                        <button
                          onClick={(e) => handleSpeak(card.word, e)}
                          className="opacity-20 hover:opacity-100 transition-all hover:scale-110 active:scale-90"
                        >
                          <Volume2 size={16} />
                        </button>
                      </div>
                    </div>

                    <h2 className="text-5xl tracking-tight mb-2 font-sans font-normal" style={{ fontFamily: 'Verdana, sans-serif' }}>
                      {card.word}
                    </h2>
                    <p className="font-serif italic opacity-40 text-sm mb-8">{card.phonetic}</p>
                    <div className="h-[1px] w-8 mb-8" style={{ backgroundColor: theme.accent, opacity: 0.3 }} />
                    <p className="text-sm leading-relaxed opacity-70 mb-4 font-serif italic">{card.def}</p>
                  </div>

                  <div className="relative z-10 border-t pt-8" style={{ borderColor: theme.lineColor }}>
                    <p className="text-[13px] font-sans opacity-40 leading-relaxed tracking-wide italic">&quot;{card.ex}&quot;</p>
                  </div>

                  <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_40px_rgba(0,0,0,0.02)]" />
                </motion.div>
              );
            })
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex flex-col items-center justify-center opacity-30">
              <p className="text-[10px] uppercase tracking-[0.4em] mb-4">Deck Complete</p>
              <button onClick={() => setCards(vocab)} className="p-2 hover:scale-110 transition-transform"><RotateCcw size={20} /></button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
