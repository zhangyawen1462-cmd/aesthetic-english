"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { BookmarkCheck, Highlighter, Languages } from "lucide-react";

interface ModuleScriptProps {
  currentTime: number;
  isPlaying: boolean;
  theme: any;
  onSeek: (t: number) => void;
  setIsPlaying: (p: boolean) => void;
}

const TRANSCRIPT = [
  { id: 1, start: 0, end: 2.5, en: "Hi Laura, we're the Dallas Cowboys Cheerleaders.", cn: "嗨 Laura，我们是达拉斯牛仔啦啦队。" },
  { id: 2, start: 2.6, end: 5.5, en: "And welcome to the Cowboys Christmas Extravaganza!", cn: "欢迎来到牛仔圣诞盛典！" },
  { id: 3, start: 5.6, end: 8.5, en: "We are so excited to have you here today.", cn: "我们非常兴奋能邀请你来到现场。" },
  { id: 4, start: 8.6, end: 12.0, en: "This city is a symphony of secrets after midnight.", cn: "午夜后的这座城市，是一首秘密的交响曲。" },
  { id: 5, start: 12.1, end: 15.0, en: "Tell me, what brings you to this side of the velvet rope?", cn: "告诉我，是什么风把你吹到了天鹅绒围栏的这一边？" },
  { id: 6, start: 15.1, end: 18.0, en: "Fashion is not just about clothes, it's about attitude.", cn: "时尚不仅仅是衣服，更是态度。" }
];

type LangMode = 'en' | 'cn' | 'bi';

export default function ModuleScript({ currentTime, isPlaying, theme, onSeek, setIsPlaying }: ModuleScriptProps) {
  const [savedIds, setSavedIds] = useState<number[]>([]); 
  const [langMode, setLangMode] = useState<LangMode>('bi'); // 默认为双语
  const activeLineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeLineRef.current && isPlaying) {
      activeLineRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentTime, isPlaying]);

  return (
    <div className="flex-1 w-full h-full flex flex-col relative">
      
      {/* 1. 顶部工具栏 (语言切换) */}
      <div className="w-full px-8 py-4 flex justify-between items-center z-20 sticky top-0 backdrop-blur-sm border-b border-black/5" style={{ backgroundColor: theme.bg + 'CC' }}>
        <span className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-40 flex items-center gap-2">
          <Languages size={12} /> View Mode
        </span>
        
        {/* 极简文字开关 */}
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

      {/* 2. 字幕流内容 */}
      <div className="flex-1 w-full max-w-3xl mx-auto overflow-y-auto px-8 pb-40 no-scrollbar space-y-2">
         <div className="h-4" />
         {TRANSCRIPT.map((line) => {
           const isActive = currentTime >= line.start && currentTime <= line.end;
           const isSaved = savedIds.includes(line.id);

           return (
             <motion.div
               key={line.id}
               ref={isActive ? activeLineRef : null}
               onClick={() => { onSeek(line.start); setIsPlaying(true); }}
               animate={{ opacity: isActive ? 1 : (isSaved ? 0.8 : 0.25) }}
               className={`relative py-5 pl-6 pr-4 transition-all duration-500 cursor-pointer group border-l-[3px]
                 ${isActive ? "border-current" : "border-transparent hover:border-black/5"}
               `}
               style={{ borderColor: isActive ? theme.accent : 'transparent' }}
             >
               {/* 高亮背景 */}
               {(isSaved || isActive) && (
                 <div 
                   className="absolute inset-0 -z-10 rounded-r-lg transition-opacity duration-500 mix-blend-multiply"
                   style={{ 
                     backgroundColor: theme.highlight,
                     opacity: isActive ? 1 : 0.5 
                   }} 
                 />
               )}

               <div className="flex flex-col gap-2">
                 <div className="flex justify-between items-start gap-4">
                   {/* 英文部分 */}
                   {(langMode === 'en' || langMode === 'bi') && (
                     <p className="text-lg font-normal leading-snug tracking-tight" style={{ fontFamily: 'Verdana, sans-serif' }}>
                       {line.en}
                     </p>
                   )}
                   
                   {/* 纯中文模式下显示大号中文 */}
                   {langMode === 'cn' && (
                      <p className="text-xl font-serif leading-snug text-current">
                        {line.cn}
                      </p>
                   )}

                   {/* 收藏按钮 */}
                   <button
                     onClick={(e) => { 
                       e.stopPropagation(); 
                       setSavedIds(prev => prev.includes(line.id) ? prev.filter(i => i !== line.id) : [...prev, line.id]);
                     }}
                     className={`opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ${isSaved ? "opacity-100 text-current" : "opacity-0"}`}
                     style={{ color: theme.accent }}
                   >
                     {isSaved ? <BookmarkCheck size={18} /> : <Highlighter size={18} />}
                   </button>
                 </div>

                 {/* 双语模式下的中文 (Serif 小字) */}
                 {langMode === 'bi' && (
                   <p className="text-[16px] font-serif leading-snug opacity-70" style={{ letterSpacing: '0.01em' }}>
                     {line.cn}
                   </p>
                 )}
               </div>
             </motion.div>
           );
         })}
      </div>
    </div>
  );
}