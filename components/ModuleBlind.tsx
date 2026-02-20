"use client";

import React from "react";
import { motion } from "framer-motion";
import { Music } from "lucide-react";

import type { ThemeConfig } from "@/lib/theme-config";

interface ModuleBlindProps {
  isPlaying: boolean;
  playbackRate: number;
  theme: ThemeConfig;
  setPlaybackRate: (rate: number) => void;
  videoUrl?: string;
  lessonId?: string;
  lessonTitle?: string;
}

export default function ModuleBlind({ 
  isPlaying, 
  playbackRate, 
  theme, 
  setPlaybackRate,
  videoUrl = '',
  lessonId = '',
  lessonTitle = 'audio'
}: ModuleBlindProps) {
  const rotationDuration = 15 / playbackRate;

  // 🔍 调试日志
  console.log('🎵 ModuleBlind Props:', {
    videoUrl,
    lessonId,
    lessonTitle,
    hasVideoUrl: !!videoUrl && videoUrl.trim() !== ''
  });

  // 获取光晕颜色（主题3使用更深的粉色）
  const getGlowColor = () => {
    if (theme.id === 'business') return '#B89099'; // 更深的粉色，饱和度更高
    return theme.accent;
  };
  const glowColor = getGlowColor();

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden" style={{ backgroundColor: theme.bg }}>
      
      {/* ─── 1. 背景层：极致柔化 - 使用 CSS 渐变替代缺失的图片 ─── */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
          style={{ 
            background: `
              radial-gradient(circle at 50% 50%, rgba(0,0,0,0.08) 0%, transparent 70%),
              radial-gradient(circle at 20% 80%, rgba(0,0,0,0.05) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(0,0,0,0.05) 0%, transparent 50%)
            `,
            opacity: 0.03,
            mixBlendMode: 'multiply',
            filter: 'blur(4px) grayscale(80%)',
            maskImage: 'radial-gradient(circle at center, black 60%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(circle at center, black 60%, transparent 100%)'
          }}
        />
      </div>

      {/* ─── 2. 全局纹理 ─── */}
      <div 
        className="absolute inset-0 pointer-events-none z-0"
        style={{ 
          backgroundColor: theme.bg, 
          opacity: 0.08,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          mixBlendMode: 'overlay',
          maskImage: 'radial-gradient(circle, black 70%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(circle, black 70%, transparent 100%)'
        }} 
      />
      
      {/* 3. 晕染光晕 (背光) - 优化移动端显示 */}
      <div 
        className="relative z-10 flex flex-col items-center justify-center mb-12 sm:mb-20"
        style={{ backgroundColor: theme.bg }}
      >
        {/* 光晕层 - 移动端加大尺寸，降低模糊 */}
        <motion.div 
           animate={{ 
             scale: isPlaying ? [1, 1.05, 1] : 1,
             opacity: isPlaying ? 0.6 : 0.3
           }}
           transition={{ 
             scale: { repeat: Infinity, ease: "easeInOut", duration: 4 } 
           }}
           className="absolute z-0 rounded-full pointer-events-none w-[280px] h-[280px] sm:w-[350px] sm:h-[350px]"
           style={{ 
             backgroundColor: glowColor,
             filter: 'blur(50px) saturate(150%)',
             opacity: 0.5
           }}
        />

        {/* 4. 黑胶主体 (Ultra-Realistic Vinyl) */}
        <motion.div
          animate={{ rotate: isPlaying ? 360 : 0 }}
          transition={{
            rotate: isPlaying 
              ? { repeat: Infinity, ease: "linear", duration: rotationDuration } 
              : { duration: 1.2, ease: [0.32, 0.72, 0, 1] }
          }}
          style={{
            willChange: 'transform',
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden',
          }}
          className="relative w-[200px] h-[200px] sm:w-80 sm:h-80 rounded-full shadow-[0_20px_60px_-10px_rgba(0,0,0,0.4)] z-10 flex items-center justify-center overflow-hidden"
        >
           {/* A. 唱片本体 - 中间饱和度更高的径向渐变 */}
           <div 
             className="absolute inset-0 rounded-full"
             style={{
               background: `radial-gradient(circle at center, #2a2a2a 0%, #1a1a1a 30%, #0d0d0d 60%, #080808 100%)`
             }}
           />

           {/* B. 深刻的黑色刻痕（桌面端细腻，移动端降低密度） */}
           <div 
             className="absolute inset-0 rounded-full opacity-60 sm:opacity-90"
             style={{ 
               background: `repeating-radial-gradient(
                 circle at center, 
                 transparent 0px,
                 transparent 0.8px,
                 rgba(0,0,0,0.6) 0.8px,
                 rgba(0,0,0,0.6) 1px
               )`,
               mixBlendMode: 'multiply'
             }} 
           />

           {/* C. 浅色刻痕高光（移动端降低强度） */}
           <div 
             className="absolute inset-0 rounded-full opacity-40 sm:opacity-70"
             style={{ 
               background: `repeating-radial-gradient(
                 circle at center, 
                 transparent 0px,
                 transparent 0.5px,
                 rgba(255,255,255,0.04) 0.5px,
                 rgba(255,255,255,0.04) 1px
               )` 
             }} 
           />

           {/* D. 桌面端额外的细腻刻痕（仅桌面显示） */}
           <div 
             className="hidden sm:block absolute inset-0 rounded-full opacity-50"
             style={{ 
               background: `repeating-radial-gradient(
                 circle at center, 
                 transparent 0px,
                 transparent 0.4px,
                 rgba(0,0,0,0.3) 0.4px,
                 rgba(0,0,0,0.3) 0.5px
               )`,
               mixBlendMode: 'multiply'
             }} 
           />

           {/* E. 径向光泽条纹（移动端降低密度） */}
           <div 
             className="absolute inset-0 rounded-full opacity-15 sm:opacity-25 pointer-events-none"
             style={{ 
               background: `repeating-conic-gradient(
                 from 0deg at center,
                 transparent 0deg,
                 rgba(255,255,255,0.08) 0.5deg,
                 transparent 1deg,
                 transparent 2deg
               )`,
               mixBlendMode: 'overlay'
             }} 
           />

           {/* F. X形主反光（移动端柔化） */}
           <div 
             className="absolute inset-0 rounded-full opacity-15 sm:opacity-20 pointer-events-none"
             style={{ 
               background: `conic-gradient(
                 from 0deg at center,
                 transparent 0deg,
                 rgba(255,255,255,0.3) 40deg,
                 transparent 50deg,
                 transparent 85deg,
                 rgba(255,255,255,0.3) 130deg,
                 transparent 140deg,
                 transparent 175deg,
                 rgba(255,255,255,0.3) 220deg,
                 transparent 230deg,
                 transparent 265deg,
                 rgba(255,255,255,0.3) 310deg,
                 transparent 320deg,
                 transparent 360deg
               )`,
               filter: 'blur(12px)',
               mixBlendMode: 'screen'
             }} 
           />

           {/* G. 表面微妙色彩变化 */}
           <div 
             className="absolute inset-0 rounded-full opacity-20 sm:opacity-30 pointer-events-none"
             style={{ 
               background: `radial-gradient(circle at 30% 30%, rgba(60,60,60,0.2) 0%, transparent 50%)`,
               mixBlendMode: 'overlay'
             }} 
           />

           {/* H. 细微划痕（移动端降低强度） */}
           <div 
             className="absolute inset-0 opacity-[0.04] sm:opacity-[0.08] pointer-events-none"
             style={{ 
               backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='scratch'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='2.5' numOctaves='4' seed='7'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23scratch)'/%3E%3C/svg%3E")`,
               mixBlendMode: 'soft-light'
             }} 
           />

           {/* I. 边缘高光和深度 */}
           <div 
             className="absolute inset-0 rounded-full"
             style={{
               boxShadow: `
                 inset 0 0 30px rgba(0,0,0,0.9),
                 inset 0 1px 2px rgba(255,255,255,0.1),
                 0 0 0 1px rgba(255,255,255,0.05)
               `
             }}
           />

           {/* H. 中心标签 */}
           <div 
             className="absolute w-[80px] h-[80px] sm:w-32 sm:h-32 rounded-full flex items-center justify-center z-30"
             style={{ 
               backgroundColor: theme.accent,
               backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='paper'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.5' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23paper)' opacity='0.3'/%3E%3C/svg%3E")`,
               backgroundBlendMode: 'multiply',
               boxShadow: `
                 inset 0 0 15px rgba(0,0,0,0.8),
                 0 2px 8px rgba(0,0,0,0.3),
                 0 0 0 1px rgba(255,255,255,0.1)
               `
             }}
           >
             <div className="absolute inset-2 rounded-full border-[1px] border-black/30 opacity-50" />
             <div className="absolute w-2 h-2 sm:w-3.5 sm:h-3.5 bg-[#050505] rounded-full border-[1px] border-black/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]" />
           </div>
        </motion.div>
      </div>

      {/* 5. 底部调速盘 */}
      <div className="flex flex-col items-center gap-3 z-20">
        {/* 调速盘 */}
        <div 
          className="flex items-center gap-2 sm:gap-4 px-3 py-2 sm:px-4 sm:py-2.5 rounded-full transition-all duration-500 shadow-2xl touch-manipulation"
          style={{ 
            color: theme.text,
            background: `linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)`,
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px) saturate(180%)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
          }}
        >
          <div className="pl-1 sm:pl-2 opacity-40">
            <Music size={13} className="sm:w-[15px] sm:h-[15px]" />
          </div>
          {[0.5, 0.75, 1].map((rate) => (
            <button 
              key={rate} 
              onClick={() => setPlaybackRate(rate)} 
              className={`relative h-8 sm:h-9 px-4 sm:px-5 rounded-full flex items-center justify-center text-[11px] sm:text-xs font-sans transition-all duration-300 touch-manipulation ${
                playbackRate === rate 
                  ? 'opacity-100 font-bold scale-105' 
                  : 'opacity-50 hover:opacity-80 active:opacity-80 hover:scale-105'
              }`}
              style={{
                background: playbackRate === rate 
                  ? `linear-gradient(135deg, ${theme.accent}40 0%, ${theme.accent}20 100%)`
                  : 'transparent',
                border: playbackRate === rate 
                  ? `1px solid ${theme.accent}30`
                  : '1px solid transparent',
                boxShadow: playbackRate === rate 
                  ? `0 2px 8px ${theme.accent}20, inset 0 1px 0 ${theme.accent}10`
                  : 'none',
              }}
            >
              <span className="relative z-10">{rate}x</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}