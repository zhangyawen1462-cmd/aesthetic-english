"use client";

import { useRef } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Play, MoveRight, Archive, ArrowUpRight } from "lucide-react";
import { useParams } from "next/navigation";

// --- 1. 核心配置：色板与署名 ---
const CURATOR_SIGNATURE = "Curated by Scarlett Zhang";

// 噪点纹理 (直接内嵌 SVG，确保纸张/胶片质感)
const NOISE_BG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E")`;

const THEMES: Record<string, any> = {
  daily: {
    label: "Daily Aesthetics",
    // 米色基底 (Unbleached Paper)
    bg: "bg-[#F0EEE6]", 
    curtain: "#F0EEE6", 
    // 深咖色文字 (Espresso)
    text: "text-[#3E2723]", 
    sub: "text-[#3E2723]/60",
    // 卡片遮罩：淡淡的暖雾
    overlay: "bg-[#F0EEE6]/40 backdrop-blur-[1px]", 
    border: "border-[#3E2723]/10",
  },
  cognitive: {
    label: "Cognitive Growth",
    // 石板蓝灰 (Slate Blue) - 智性、冷静
    bg: "bg-[#334155]", 
    curtain: "#334155",
    // 雾白文字
    text: "text-[#E2E8F0]", 
    sub: "text-[#E2E8F0]/50",
    // 卡片遮罩：冷雾
    overlay: "bg-[#1E293B]/40 backdrop-blur-[1px]", 
    border: "border-[#E2E8F0]/10",
  },
  business: {
    label: "Business Elite",
    // 深酒红/黑紫 (Deep Plum) - 丝绒感
    bg: "bg-[#1A0508]", 
    curtain: "#1A0508",
    // 骨白文字 (Bone White)
    text: "text-[#E8E4D9]", 
    sub: "text-[#E8E4D9]/40",
    // 卡片遮罩：深色光泽
    overlay: "bg-[#000000]/40 backdrop-blur-[1px]", 
    border: "border-[#E8E4D9]/10",
  },
};

// --- 2. 数据：Latest 5 (Liquid Flow) ---
const LATEST_EPISODES = [
  { id: 1, ep: "05", title: "Morning Rituals", subtitle: "The art of waking up slowly.", img: "/images/daily-aesthetic.jpg" },
  { id: 2, ep: "04", title: "Coffee Culture", subtitle: "Sip, savor, silence.", img: "/images/daily-aesthetic.jpg" },
  { id: 3, ep: "03", title: "City Stroll", subtitle: "Finding peace in chaos.", img: "/images/daily-aesthetic.jpg" },
  { id: 4, ep: "02", title: "Rainy Mood", subtitle: "Melancholy as a tool.", img: "/images/daily-aesthetic.jpg" },
  { id: 5, ep: "01", title: "Sunset Glow", subtitle: "The golden hour mindset.", img: "/images/daily-aesthetic.jpg" },
];

export default function LiquidGallery() {
  const params = useParams<{ category: string }>();
  const category = params?.category || "daily";
  const theme = THEMES[category] || THEMES.daily;

  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollXProgress } = useScroll({ container: containerRef });
  const scaleX = useSpring(scrollXProgress, { stiffness: 100, damping: 30 });

  return (
    <div className={`h-screen w-full overflow-hidden relative selection:bg-[#B8860B] selection:text-white ${theme.bg} transition-colors duration-1000`}>
      
      {/* --- 全局纹理层 (The Texture) --- */}
      <div 
        className="pointer-events-none fixed inset-0 z-0 opacity-40 mix-blend-overlay"
        style={{ backgroundImage: NOISE_BG }}
      />

      {/* --- A. 帷幕动画 (The Curtain) --- */}
      <motion.div
        initial={{ height: "100vh" }}
        animate={{ height: 0 }}
        transition={{ duration: 1.4, ease: [0.25, 1, 0.5, 1] }} 
        style={{ backgroundColor: theme.curtain }}
        className="absolute top-0 left-0 w-full z-[100] pointer-events-none"
      />

      {/* --- B. 顶部导航 (Minimalist) --- */}
      <header className="fixed top-0 left-0 w-full z-40 px-8 py-8 flex justify-between items-start pointer-events-none mix-blend-difference text-white/90">
        <Link href="/dashboard" className="pointer-events-auto flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] opacity-60 hover:opacity-100 transition-opacity">
          <ArrowLeft size={14} /> 
          <span>Lobby</span>
        </Link>
        <div className="flex flex-col items-end">
          <span className="text-[10px] uppercase tracking-widest opacity-60">{theme.label}</span>
          <div className="w-12 h-[1px] bg-white/20 mt-3 overflow-hidden">
             <motion.div style={{ scaleX, transformOrigin: "left" }} className="h-full w-full bg-white" />
          </div>
        </div>
      </header>

      {/* --- C. 署名 (Signature) --- */}
      <div className="fixed bottom-8 left-8 z-40 pointer-events-none mix-blend-difference text-white/40">
        <span className="font-serif italic text-xs tracking-wide">{CURATOR_SIGNATURE}</span>
      </div>

      {/* --- D. 横向画廊 (The Gallery) --- */}
      <div 
        ref={containerRef} 
        className="relative z-10 h-full w-full overflow-x-auto overflow-y-hidden flex items-center px-[8vw] gap-[8vw] snap-x snap-mandatory no-scrollbar"
      >
        
        {/* 1. 刊首语 (Editorial Intro) */}
        <div className="shrink-0 w-[25vw] md:w-[20vw] h-full flex flex-col justify-center snap-center pl-2">
           <motion.div 
             initial={{ opacity: 0, filter: "blur(10px)" }} 
             animate={{ opacity: 1, filter: "blur(0px)" }} 
             transition={{ delay: 0.5, duration: 1.2 }}
           >
             <h1 className={`font-serif text-6xl md:text-8xl italic leading-[0.85] mb-8 ${theme.text}`}>
               The <br/> Latest <br/> Edit.
             </h1>
             <div className={`text-[10px] uppercase tracking-[0.25em] ${theme.sub} flex items-center gap-3`}>
               <span className="animate-pulse">Scroll</span> <ArrowRight size={12} />
             </div>
           </motion.div>
        </div>

        {/* 2. 作品流 (The Works) */}
        {LATEST_EPISODES.map((item, index) => (
          <motion.div 
            key={item.id}
            className="shrink-0 w-[85vw] md:w-[38vw] h-[60vh] md:h-[65vh] snap-center relative group"
            initial={{ opacity: 0, x: 100 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: index * 0.1, ease: "easeOut" }}
            viewport={{ once: true }}
          >
            <Link href={`/course/${category}/${item.id}`} className="block h-full w-full relative">
              
              {/* 图片容器 - 带有“呼吸”效果 */}
              <div className="relative w-full h-[85%] overflow-hidden rounded-[2px] shadow-lg transition-all duration-1000 group-hover:shadow-2xl">
                
                {/* 磨砂层 (The Matte Layer) - 默认覆盖，悬停消散 */}
                {/* 这就像是你隔着一层薄纸看图片，鼠标放上去纸就被拿走了 */}
                <div className={`absolute inset-0 z-20 pointer-events-none transition-opacity duration-700 opacity-100 group-hover:opacity-0 ${theme.overlay}`} />
                
                {/* 图片层 */}
                {item.img ? (
                  <Image 
                    src={item.img} 
                    alt={item.title} 
                    fill 
                    className={`
                      object-cover z-10
                      ${category === 'daily' ? 'grayscale-[20%] contrast-[0.95]' : 'grayscale-[40%] contrast-[1.1]'}
                      transition-all duration-1000 ease-out 
                      group-hover:scale-[1.03] group-hover:grayscale-0 group-hover:contrast-100
                    `}
                  />
                ) : (
                  <div className={`w-full h-full ${theme.bg} opacity-50`} />
                )}
                
                {/* 编号 - 像杂志一样压在图片边缘 */}
                <span className="absolute -top-6 -left-8 font-serif text-[10rem] leading-none text-white/5 mix-blend-overlay pointer-events-none z-30 select-none">
                  {item.ep}
                </span>

                {/* 播放按钮 - 极简线条感 */}
                <div className="absolute inset-0 flex items-center justify-center z-40 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                   <div className="h-20 w-20 rounded-full border-[0.5px] border-white/60 flex items-center justify-center backdrop-blur-sm text-white bg-black/5">
                      <Play size={24} strokeWidth={1} fill="currentColor" className="opacity-80" />
                   </div>
                </div>
              </div>

              {/* 底部信息 (Minimal Info) */}
              <div className={`mt-6 border-t border-dotted ${theme.border} pt-4 flex justify-between items-start`}>
                <div className="max-w-[85%]">
                  <h2 className={`font-serif text-3xl md:text-4xl italic leading-none ${theme.text} group-hover:translate-x-2 transition-transform duration-700`}>
                    {item.title}
                  </h2>
                  <p className={`text-[10px] uppercase tracking-widest mt-2 ${theme.sub}`}>{item.subtitle}</p>
                </div>
                {/* 交互：箭头 */}
                <div className={`opacity-0 group-hover:opacity-100 transition-all duration-700 transform translate-y-2 group-hover:translate-y-0 ${theme.text}`}>
                   <ArrowUpRight size={20} strokeWidth={1} />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}

        {/* 3. Archive 入口 (The End Gate) */}
        <div className="shrink-0 w-[80vw] md:w-[30vw] h-[60vh] md:h-[65vh] snap-center flex items-center justify-center pr-[5vw]">
           <Link 
             href={`/archives?filter=${category}`} 
             className={`
               group relative w-full h-[85%] flex flex-col items-center justify-center 
               border border-dotted ${theme.text} border-opacity-20 rounded-[2px]
               hover:bg-current/5 hover:border-solid transition-all duration-700
             `}
           >
              {/* 这里的图标也会有轻微的浮动效果 */}
              <div className="group-hover:-translate-y-2 transition-transform duration-700">
                <Archive size={36} className={`${theme.text} opacity-40`} strokeWidth={0.5}/>
              </div>
              
              <span className={`font-serif text-4xl italic mt-6 ${theme.text}`}>Full Archive</span>
              <span className={`text-[9px] uppercase tracking-[0.25em] mt-3 opacity-50 ${theme.sub}`}>View Collection</span>
              
              <div className={`absolute bottom-12 flex items-center gap-3 text-[10px] uppercase ${theme.text} opacity-0 group-hover:opacity-60 transition-all duration-700 transform translate-y-4 group-hover:translate-y-0`}>
                 <span>Open Library</span> <MoveRight size={10} />
              </div>
           </Link>
        </div>

        {/* 留白 */}
        <div className="shrink-0 w-[5vw]" />

      </div>
    </div>
  );
}