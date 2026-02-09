"use client";

import { motion } from "framer-motion";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

// --- 策展数据 ---
const SECTIONS = [
  {
    id: "daily",
    title: "Daily Aesthetics",
    subtitle: "Vlog / Lifestyle",
    description: "La dolce vita. English through the lens of romantic living.",
    bg: "bg-powder-blue",
    text: "text-plum-wine",
    grid: "col-span-1 md:col-span-8 md:row-span-2",
    img: "/images/daily-sketch.jpg",
  },
  {
    id: "cognitive",
    title: "Cognitive Growth",
    subtitle: "Psychology / Deep Dive",
    description: "Soulful conversations for the mind.",
    bg: "bg-[#EAE6D6]",
    text: "text-plum-wine",
    grid: "col-span-1 md:col-span-4 md:row-span-4",
    img: "/images/cognitive-text.jpg",
  },
  {
    id: "business",
    title: "Business Elite",
    subtitle: "Leadership / Negotiation",
    description: "Professional expressions for the modern workplace.",
    bg: "bg-[#1A1A1A]",
    text: "text-[#E8E4D9]",
    grid: "col-span-1 md:col-span-8 md:row-span-2",
    img: "/images/business-elite.jpg",
  },
];

export default function Dashboard() {
  return (
    <div className="min-h-screen w-full bg-ecru relative selection:bg-plum-wine selection:text-ecru">
      
      {/* 1. 全局纹理背景 */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-noise" />

      {/* 2. 侧边栏 */}
      <Sidebar />

      {/* 3. 顶部导航 */}
      <header className="relative z-10 flex w-full items-center justify-between px-8 py-8 md:px-16">
        <Link href="/" className="text-xs font-bold tracking-[0.2em] text-plum-wine uppercase hover:opacity-70 transition-opacity">
          Aesthetic English
        </Link>
        <div className="flex items-center gap-2 text-[10px] tracking-widest text-plum-wine/60">
          <span className="h-2 w-2 rounded-full bg-plum-wine/30 animate-pulse" />
          GALLERY VIEW
        </div>
      </header>

      {/* 4. 主要内容区 */}
      <main className="relative z-10 mx-auto max-w-7xl px-6 pb-20 md:px-16">
        
        {/* 标题区 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-12 flex flex-col gap-3"
        >
          <h1 className="font-serif text-4xl md:text-5xl text-plum-wine italic">
            Curated Collections
          </h1>
          <div className="flex items-center gap-4">
            <div className="h-[1px] w-12 bg-plum-wine/30" />
            <p className="text-xs uppercase tracking-[0.15em] text-plum-wine/80">
              Select your path
            </p>
          </div>
        </motion.div>

        {/* 网格卡片区 */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:gap-6 md:auto-rows-[180px]">
          {SECTIONS.map((section, index) => {
            const isDark = section.id === "business";

            return (
              <Link 
                key={section.id} 
                href={`/course/${section.id}`} 
                className={`${section.grid} group relative block overflow-hidden rounded-sm shadow-sm hover:shadow-2xl transition-shadow duration-500`}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  className={`h-full w-full ${section.bg} ${section.text} relative flex flex-col justify-between overflow-hidden p-8 transition-all duration-700`}
                >
                  {/* --- 背景显影层 (Business高亮版) --- */}
                  <div className={`
                    absolute inset-0 z-0 
                    opacity-0 transition-all duration-1000 
                    /* Business (isDark): 
                       - opacity-80: 大幅提升可见度
                       - mix-blend-overlay: 保持金属光泽
                    */
                    ${isDark ? 'group-hover:opacity-80 mix-blend-overlay' : 'group-hover:opacity-25 mix-blend-multiply'}
                  `}>
                    <img 
                      src={section.img} 
                      alt="" 
                      className={`
                        h-full w-full object-cover transition-transform duration-[3000ms] group-hover:scale-105
                        /* Daily: 暖调 */
                        ${index === 0 ? 'sepia-[0.2] contrast-[1.1]' : ''}
                        /* Cognitive: 灰调 */
                        ${index === 1 ? 'grayscale-[90%] contrast-[1.2] brightness-110' : ''}
                        /* Business: 亮度大幅提升 (brightness-150)，让白线发光 */
                        ${index === 2 ? 'grayscale-[100%] contrast-[1.4] brightness-150' : ''}
                      `} 
                    />
                  </div>

                  {/* --- 双层边框 --- */}
                  <div className={`absolute inset-0 border pointer-events-none ${isDark ? 'border-ecru/5' : 'border-plum-wine/5'}`} />
                  <div className={`
                    absolute inset-4 border opacity-0 scale-95 transition-all duration-500 group-hover:opacity-100 group-hover:scale-100 pointer-events-none
                    ${isDark ? 'border-ecru/30' : 'border-plum-wine/30'}
                  `} />

                  {/* --- 策展印章 --- */}
                  <div className="absolute top-6 right-6 z-20 flex flex-col items-end opacity-40 group-hover:opacity-100 transition-opacity duration-500">
                    <div className={`text-3xl font-serif italic ${isDark ? 'text-ecru/20' : 'text-plum-wine/20'} group-hover:text-plum-wine transition-colors duration-500`}>
                      0{index + 1}
                    </div>
                    <div className={`h-[1px] w-8 ${isDark ? 'bg-ecru/20' : 'bg-plum-wine/20'} mt-1`} />
                  </div>

                  {/* --- 内容层 --- */}
                  <div className="relative z-10">
                    <span className="text-[9px] uppercase tracking-[0.25em] opacity-70 block mb-2">
                      {section.subtitle}
                    </span>
                    <h2 className="font-serif text-3xl md:text-4xl italic leading-tight">
                      {section.title}
                    </h2>
                  </div>

                  <div className="relative z-10 flex items-end justify-between mt-8 md:mt-0">
                    <p className="max-w-[220px] text-[11px] font-light leading-relaxed opacity-80">
                      {section.description}
                    </p>
                    
                    {/* 箭头交互 */}
                    <div className={`flex items-center justify-center w-9 h-9 rounded-full border ${isDark ? 'border-ecru/30 text-ecru' : 'border-plum-wine/30 text-plum-wine'} transition-all duration-500 group-hover:bg-plum-wine group-hover:border-plum-wine group-hover:text-ecru`}>
                      <ArrowUpRight className="h-4 w-4" />
                    </div>
                  </div>

                </motion.div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}