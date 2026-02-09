"use client";

import React from "react";
import { motion } from "framer-motion";
import { Music } from "lucide-react";

interface ModuleBlindProps {
  isPlaying: boolean;
  playbackRate: number;
  theme: any;
  setPlaybackRate: (rate: number) => void;
}

export default function ModuleBlind({ isPlaying, playbackRate, theme, setPlaybackRate }: ModuleBlindProps) {
  // 旋转周期：1x 倍速下转一圈需要 15 秒
  const rotationDuration = 15 / playbackRate;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden">
      
      {/* 全局做旧纹理背景 */}
      <div className="absolute inset-0 opacity-[0.15] pointer-events-none mix-blend-overlay z-0"
           style={{ 
             backgroundColor: theme.bg, 
             backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.6' numOctaves='5' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
             filter: 'contrast(150%) brightness(80%)'
           }} 
      />
      
      {/* 1. 晕染光晕 (背光) */}
      <div className="relative z-10 flex flex-col items-center justify-center mb-20">
        <motion.div 
           animate={{ 
             // 播放时呼吸，暂停时停止
             scale: isPlaying ? [1, 1.1, 1] : 1,
             opacity: isPlaying ? 0.6 : 0.3       
           }}
           transition={{ 
             scale: { repeat: Infinity, ease: "easeInOut", duration: 6 } 
           }}
           className="absolute z-0 blur-[100px] rounded-full mix-blend-screen pointer-events-none"
           style={{ 
             backgroundColor: theme.accent,
             width: '380px', height: '380px',
             // 简化的光晕，更稳定
             boxShadow: `0 0 100px 50px ${theme.accent}40`
           }}
        />

        {/* 2. 战损黑胶主体 (旋转容器) */}
        <motion.div
          // ✅ 核心旋转逻辑：播放时转到360度，无限循环
          animate={{ rotate: isPlaying ? 360 : 0 }}
          transition={{
            rotate: isPlaying 
              ? { repeat: Infinity, ease: "linear", duration: rotationDuration } // 播放时：无限匀速旋转
              : { duration: 0.5, ease: "easeOut" } // 暂停时：0.5秒平滑复位
          }}
          className="relative w-80 h-80 rounded-full shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)] z-10 flex items-center justify-center overflow-hidden border-[1px] border-white/5"
          style={{ backgroundColor: "#0C0C0C" }} // 极深色底
        >
           {/* A. 物理刻痕纹理 */}
           <div className="absolute inset-0 rounded-full opacity-80"
             style={{ background: `repeating-radial-gradient(circle at center, #0C0C0C 0, #0C0C0C 2px, #1C1C1C 3px, #1C1C1C 4px)` }} />
           
           {/* B. 表面噪点与划痕 (Heavy Aging) */}
           <div className="absolute inset-0 opacity-[0.5] pointer-events-none mix-blend-soft-light"
                style={{ 
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='grunge'%3E%3CfeTurbulence type='turbulence' baseFrequency='0.03' numOctaves='4' result='turbulence'/%3E%3CfeDisplacementMap in2='turbulence' in='SourceGraphic' scale='40' xChannelSelector='R' yChannelSelector='G'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' fill='black'/ >%3Crect width='100%25' height='100%25' filter='url(%23grunge)' opacity='0.7'/%3E%3C/svg%3E")`,
                  filter: 'contrast(200%) brightness(60%)'
                }} 
           />

           {/* ✅ C. 淡淡的水印 (横跨整体，随唱片旋转) */}
           <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden mix-blend-plus-lighter opacity-[0.05] z-20">
             <p className="text-[100px] font-black uppercase tracking-tighter -rotate-[15deg] select-none whitespace-nowrap filter blur-[1px]"
                style={{ fontFamily: '"Times New Roman", serif', color: theme.text }}>
               scarlettzhang
             </p>
           </div>

           {/* D. 中心标签 (干净无字版) */}
           <div 
             className="absolute w-32 h-32 rounded-full flex items-center justify-center shadow-[inset_0_0_20px_rgba(0,0,0,0.9)] border-[1px] border-white/10 z-30"
             style={{ 
               backgroundColor: theme.accent, // 跟随点缀色 (酒红)
               // 标签纸张纹理
               backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='paper'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23paper)' opacity='0.5'/%3E%3C/svg%3E")`,
               backgroundBlendMode: 'multiply'
             }}
           >
             {/* 装饰环 */}
             <div className="absolute inset-2 rounded-full border-[1px] border-black/30 opacity-50" />
             {/* 中心孔 */}
             <div className="absolute w-3.5 h-3.5 bg-[#050505] rounded-full border-[1px] border-black/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]" />
           </div>
        </motion.div>
      </div>

      {/* 3. 底部调速盘 */}
      <div className="flex items-center gap-4 p-2 pr-4 rounded-full border border-white/5 bg-black/30 backdrop-blur-md z-20 transition-opacity duration-500 shadow-xl" style={{ color: theme.text }}>
        <div className="pl-3 opacity-30"><Music size={14} /></div>
        {[0.5, 0.75, 1].map((rate) => (
          <button key={rate} onClick={() => setPlaybackRate(rate)} className={`relative h-8 px-3 rounded-full flex items-center justify-center text-[11px] font-serif italic transition-all duration-500 ${playbackRate === rate ? 'opacity-100 font-bold' : 'opacity-40 hover:opacity-80'}`}>
            {playbackRate === rate && <motion.div layoutId="speedHighlight" className="absolute inset-0 rounded-full opacity-10" style={{ backgroundColor: theme.accent }} />}
            <span className="relative z-10">{rate}x</span>
          </button>
        ))}
      </div>
    </div>
  );
}