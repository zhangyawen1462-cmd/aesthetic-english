"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Volume2, Bookmark, Check } from "lucide-react";

const MOCK_VOCAB = [
  { id: 1, word: "Discipline", phonetic: "/ˈdɪs.ə.plɪn/", def: "The practice of training people to obey rules.", ex: "It is about the discipline behind the smile." },
  { id: 2, word: "Precision", phonetic: "/prɪˈsɪʒ.ən/", def: "The quality of being accurate and exact.", ex: "Every move requires absolute precision." },
  { id: 3, word: "Aesthetics", phonetic: "/esˈθet.ɪks/", def: "A set of principles concerned with nature and appreciation of beauty.", ex: "This is the aesthetics of power." },
];

export default function ModuleVocab({ theme }: any) {
  const [cards, setCards] = useState(MOCK_VOCAB);
  const [direction, setDirection] = useState(0);
  const [savedIds, setSavedIds] = useState<number[]>([]);

  // --- 朗读插件核心逻辑 ---
  const handleSpeak = (text: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 防止触发卡片滑动
    
    // 取消当前正在进行的朗读
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.85; // 稍微放慢，增加优雅感
    utterance.pitch = 1.0;

    // 尝试获取系统内的高级女声
    const voices = window.speechSynthesis.getVoices();
    const premiumVoice = voices.find(v => v.name.includes("Samantha") || v.name.includes("Google US English"));
    if (premiumVoice) utterance.voice = premiumVoice;

    window.speechSynthesis.speak(utterance);
  };

  const handleDragEnd = (event: any, info: any) => {
    if (info.offset.x > 100) popCard();
    else if (info.offset.x < -100) reorderCard();
  };

  const popCard = () => setCards((prev) => prev.slice(1));
  const reorderCard = () => setCards((prev) => [...prev.slice(1), prev[0]]);

  const toggleSave = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 relative">
      
      {/* 1. 艺术感悬停指令 */}
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
              const isSaved = savedIds.includes(card.id);

              return (
                <motion.div
                  key={card.id}
                  style={{
                    zIndex: cards.length - index,
                    backgroundColor: theme.bg,
                    color: theme.text,
                    borderColor: theme.lineColor,
                  }}
                  className={`absolute inset-0 rounded-sm border shadow-2xl p-10 flex flex-col justify-between cursor-grab active:cursor-grabbing overflow-hidden`}
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1 - index * 0.05, opacity: 1 - index * 0.3, y: index * -15 }}
                  exit={{ x: direction > 0 ? 500 : -500, opacity: 0, rotate: direction > 0 ? 20 : -20 }}
                  drag={isFirst ? "x" : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  onDragStart={() => setDirection(0)}
                  onDrag={(e, info) => setDirection(info.offset.x)}
                  onDragEnd={handleDragEnd}
                >
                  {/* --- 做旧磨砂效果叠加层 --- */}
                  <div className="pointer-events-none absolute inset-0 opacity-[0.05] bg-noise mix-blend-multiply" />
                  <div className="pointer-events-none absolute inset-0 backdrop-blur-[0.5px] bg-orange-900/5 mix-blend-soft-light" />
                  
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <span className="text-[10px] font-mono opacity-30">#0{card.id}</span>
                      
                      <div className="flex gap-4">
                        {/* 收藏按钮 */}
                        <button 
                          onClick={(e) => toggleSave(card.id, e)}
                          className={`transition-all duration-500 hover:scale-110 ${isSaved ? 'opacity-100' : 'opacity-20 hover:opacity-60'}`}
                          style={{ color: isSaved ? theme.accent : theme.text }}
                        >
                          {isSaved ? <Check size={16} /> : <Bookmark size={16} />}
                        </button>
                        
                        {/* 朗读按钮 */}
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
                     <p className="text-[13px] font-sans opacity-40 leading-relaxed tracking-wide italic">"{card.ex}"</p>
                  </div>
                  
                  <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_40px_rgba(0,0,0,0.02)]" />
                </motion.div>
              );
            })
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex flex-col items-center justify-center opacity-30">
              <p className="text-[10px] uppercase tracking-[0.4em] mb-4">Deck Complete</p>
              <button onClick={() => setCards(MOCK_VOCAB)} className="p-2 hover:scale-110 transition-transform"><RotateCcw size={20} /></button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}