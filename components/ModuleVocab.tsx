"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { Volume2, Check, RotateCw } from "lucide-react";

interface ModuleVocabProps {
  theme: any;
  onSeek: (time: number) => void; 
}

const VOCAB_LIST = [
  { id: 1, word: "EXTRAVAGANZA", phonetics: "/ɪkˌstræv.əˈɡæn.zə/", cn: "盛大的庆典", note: "通常指场面宏大、色彩斑斓的演出，带有戏剧性。", start: 2.6 },
  { id: 2, word: "SYMPHONY", phonetics: "/ˈsɪm.fə.ni/", cn: "交响乐", note: "多种元素的复杂融合，呈现出和谐的整体感。", start: 8.6 },
  { id: 3, word: "VELVET", phonetics: "/ˈvel.vɪt/", cn: "天鹅绒", note: "形容触感柔软、光滑，常与奢华感相关联。", start: 12.1 },
  { id: 4, word: "ATTITUDE", phonetics: "/ˈæt.ɪ.tjuːd/", cn: "风度姿态", note: "在时尚语境中，特指一种自信、个性的风度。", start: 15.1 },
];

export default function ModuleVocab({ theme, onSeek }: ModuleVocabProps) {
  const [cards, setCards] = useState(VOCAB_LIST);
  const [isFlipped, setIsFlipped] = useState(false);

  const speak = (text: string, e: React.MouseEvent) => {
    e.stopPropagation(); 
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US'; 
      utterance.rate = 0.85;     
      window.speechSynthesis.speak(utterance);
    }
  };

  // ✅ 左右滑动逻辑处理
  const handleDismiss = (direction: 'left' | 'right') => {
    setIsFlipped(false);
    const [currentCard, ...remaining] = cards;

    if (direction === 'left') {
      // 👈 向左滑：没学会，放到数组末尾，循环再来
      setCards([...remaining, currentCard]);
    } else {
      // 👉 向右滑：学会了，直接移除
      setCards(remaining);
    }
  };

  const getCardColors = () => {
    if (theme.bg === "#FAF9F6") return { frontBg: "#FFFFFF", backBg: "#5D4037", frontText: "#1C1C1C", backText: "#FAF9F6" };
    if (theme.bg === "#E6F2F5") return { frontBg: "#FFFFFF", backBg: "#164E63", frontText: "#243447", backText: "#E6F2F5" };
    return { frontBg: "#FAF9F6", backBg: "#360E14", frontText: "#2E1C21", backText: "#E6DCCA" };
  };

  const colors = getCardColors();

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden">
      
      {/* 艺术纸质感滤镜 */}
      <svg className="absolute pointer-events-none opacity-0" width="0" height="0">
        <filter id="art-paper">
          <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="4" result="noise" />
          <feDiffuseLighting in="noise" lightingColor="#fff" surfaceScale="1.2">
            <feDistantLight azimuth="45" elevation="60" />
          </feDiffuseLighting>
          <feComposite operator="in" in2="SourceGraphic"/>
          <feBlend mode="multiply" in="SourceGraphic" />
        </filter>
      </svg>

      <div className="relative w-full max-w-sm h-[480px] flex items-center justify-center">
        <AnimatePresence mode="popLayout">
          {cards.length > 0 && (
            <Card
              key={cards[0].id}
              data={cards[0]}
              isFlipped={isFlipped}
              setIsFlipped={setIsFlipped}
              onDismiss={handleDismiss}
              speak={speak}
              onSeek={onSeek} 
              colors={colors}
              theme={theme}
            />
          )}
        </AnimatePresence>
        
        {cards.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-4 opacity-40">
            <Check size={40} strokeWidth={1} className="mx-auto"/>
            <p className="font-serif italic text-base">Finished for now.</p>
            <button onClick={() => setCards(VOCAB_LIST)} className="text-[10px] uppercase tracking-[0.2em] border-b border-current pb-1">Review Again</button>
          </motion.div>
        )}
      </div>

      {/* 底部交互指引 - 极其淡化 */}
      {cards.length > 0 && (
        <div className="absolute bottom-12 flex gap-12 opacity-20 text-[10px] tracking-widest uppercase font-medium">
          <span className="flex items-center gap-2">← Repeat</span>
          <span className="flex items-center gap-2">Mastered →</span>
        </div>
      )}
    </div>
  );
}

function Card({ data, isFlipped, setIsFlipped, onDismiss, speak, onSeek, colors, theme }: any) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-12, 12]); 
  const opacity = useTransform(x, [-150, -100, 0, 100, 150], [0, 1, 1, 1, 0]); 
  
  // 背景色反馈：左滑变淡红，右滑变淡绿（可选，这里为了清爽暂不加，仅保留位移）
  
  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.x < -100) {
      onDismiss('left');
    } else if (info.offset.x > 100) {
      onDismiss('right');
    }
  };

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.6}
      onDragEnd={handleDragEnd}
      style={{ x, rotate, opacity }}
      initial={{ scale: 0.9, opacity: 0, y: 10 }}
      animate={{ scale: 1, opacity: 1, y: 0, rotateY: isFlipped ? 180 : 0 }}
      exit={{ x: x.get() < 0 ? -400 : 400, opacity: 0, transition: { duration: 0.4 } }}
      transition={{ 
        rotateY: { duration: 0.8, ease: [0.4, 0, 0.2, 1] },
        scale: { duration: 0.4 },
        opacity: { duration: 0.2 }
      }}
      className="absolute w-[300px] h-[440px] cursor-grab active:cursor-grabbing perspective-1000"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div className="w-full h-full relative" style={{ transformStyle: "preserve-3d" }}>
        
        {/* --- FRONT --- */}
        <div 
          className="absolute inset-0 rounded-sm shadow-[0_10px_30px_rgba(0,0,0,0.08)] p-12 flex flex-col items-center justify-center backface-hidden"
          style={{ 
            backgroundColor: colors.frontBg, color: colors.frontText, 
            backfaceVisibility: "hidden", filter: "url(#art-paper)" 
          }}
        >
          {/* Main Word */}
          <div className="text-center w-full">
            <h3 
              onClick={(e) => { e.stopPropagation(); onSeek(data.start); }}
              className="text-[32px] font-bold tracking-normal leading-tight hover:opacity-60 transition-opacity mb-4" 
              style={{ fontFamily: 'Verdana, sans-serif' }}
            >
              {data.word}
            </h3>
            <p className="text-sm font-serif italic opacity-30">{data.phonetics}</p>
          </div>
          
          {/* 极其隐蔽的发音按钮 */}
          <button 
            onClick={(e) => speak(data.word, e)} 
            className="absolute bottom-10 p-4 opacity-10 hover:opacity-100 transition-opacity"
          >
            <Volume2 size={16} />
          </button>
        </div>

        {/* --- BACK --- */}
        <div 
          className="absolute inset-0 rounded-sm shadow-xl p-12 flex flex-col items-center justify-center backface-hidden text-center"
          style={{ 
            backgroundColor: colors.backBg, color: colors.backText, 
            transform: "rotateY(180deg)", backfaceVisibility: "hidden", filter: "url(#art-paper)" 
          }}
        >
          {/* 中文标题 */}
          <h3 className="text-2xl font-bold mb-8 w-full" style={{ fontFamily: '"Songti SC", serif' }}>
            {data.cn}
          </h3>
          
          {/* 解析文字 - 居中排版 */}
          <p className="text-[15px] leading-[1.7] opacity-80 font-serif max-w-[200px]">
            {data.note}
          </p>

          <div className="absolute bottom-10 opacity-10">
            <RotateCw size={14} />
          </div>
        </div>

      </div>
    </motion.div>
  );
}