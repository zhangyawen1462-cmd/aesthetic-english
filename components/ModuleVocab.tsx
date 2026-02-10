"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Volume2 } from "lucide-react";

const MOCK_VOCAB = [
  { id: 1, word: "Discipline", phonetic: "/ˈdɪs.ə.plɪn/", def: "The practice of training people to obey rules.", ex: "It is about the discipline behind the smile." },
  { id: 2, word: "Precision", phonetic: "/prɪˈsɪʒ.ən/", def: "The quality of being accurate and exact.", ex: "Every move requires absolute precision." },
  { id: 3, word: "Aesthetics", phonetic: "/esˈθet.ɪks/", def: "A set of principles concerned with nature and appreciation of beauty.", ex: "This is the aesthetics of power." },
];

export default function ModuleVocab({ theme }: any) {
  const [cards, setCards] = useState(MOCK_VOCAB);
  const [direction, setDirection] = useState(0);

  const handleDragEnd = (event: any, info: any) => {
    if (info.offset.x > 100) {
      // 向右滑动：掌握
      popCard();
    } else if (info.offset.x < -100) {
      // 向左滑动：不熟练，放回底部
      reorderCard();
    }
  };

  const popCard = () => {
    setCards((prev) => prev.slice(1));
  };

  const reorderCard = () => {
    setCards((prev) => {
      const newCards = [...prev.slice(1)];
      newCards.push(prev[0]);
      return newCards;
    });
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 relative">
      
      {/* 1. 艺术感悬停指令 (Artistic Hover Instructions) */}
      <div className="w-full max-w-[400px] mb-8 group relative h-6">
          <div className="flex justify-between items-center w-full px-2 transition-all duration-1000 ease-out opacity-0 blur-sm group-hover:opacity-40 group-hover:blur-0">
             <span className="text-[9px] uppercase tracking-[0.3em] italic" style={{ color: theme.text }}>
                ← Unknown / Reappear
             </span>
             <span className="text-[9px] uppercase tracking-[0.3em] italic" style={{ color: theme.text }}>
                Mastered / Known →
             </span>
          </div>
          {/* 装饰线：仅在悬停时显现 */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[1px] bg-current transition-all duration-1000 group-hover:w-full opacity-10" style={{ backgroundColor: theme.text }} />
      </div>

      {/* 2. 卡片堆叠逻辑 */}
      <div className="relative w-full max-w-[400px] h-[500px]">
        <AnimatePresence>
          {cards.length > 0 ? (
            cards.map((card, index) => {
              const isFirst = index === 0;
              return (
                <motion.div
                  key={card.id}
                  style={{
                    zIndex: cards.length - index,
                    backgroundColor: theme.bg,
                    color: theme.text,
                    borderColor: theme.lineColor,
                  }}
                  className={`absolute inset-0 rounded-sm border shadow-2xl p-10 flex flex-col justify-between cursor-grab active:cursor-grabbing`}
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ 
                    scale: 1 - index * 0.05, 
                    opacity: 1 - index * 0.3, 
                    y: index * -15 
                  }}
                  exit={{ 
                    x: direction > 0 ? 500 : -500, 
                    opacity: 0, 
                    rotate: direction > 0 ? 20 : -20 
                  }}
                  drag={isFirst ? "x" : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  onDragStart={() => setDirection(0)}
                  onDrag={(e, info) => setDirection(info.offset.x)}
                  onDragEnd={handleDragEnd}
                >
                  {/* 卡片纹理 (Noise Texture) */}
                  <div className="pointer-events-none absolute inset-0 opacity-[0.03] bg-noise mix-blend-multiply" />

                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <span className="text-[10px] font-mono opacity-30">#0{card.id}</span>
                      <button className="opacity-20 hover:opacity-100 transition-opacity">
                        <Volume2 size={16} />
                      </button>
                    </div>

                    <h2 className="text-5xl font-bold tracking-tight mb-2 font-sans">{card.word}</h2>
                    <p className="font-serif italic opacity-40 text-sm mb-8">{card.phonetic}</p>
                    
                    <div className="h-[1px] w-8 mb-8" style={{ backgroundColor: theme.accent }} />
                    
                    <p className="text-sm leading-relaxed opacity-70 mb-4">{card.def}</p>
                  </div>

                  <div className="relative z-10 border-t pt-8" style={{ borderColor: theme.lineColor }}>
                     <p className="text-xs font-serif italic opacity-40 leading-relaxed">
                       "{card.ex}"
                     </p>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="absolute inset-0 flex flex-col items-center justify-center opacity-30"
            >
              <p className="text-[10px] uppercase tracking-[0.4em] mb-4">Gallery Empty</p>
              <button onClick={() => setCards(MOCK_VOCAB)} className="p-2 hover:scale-110 transition-transform">
                <RotateCcw size={20} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}