"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [isExiting, setIsExiting] = useState(false);

  // --- 1. 物理引擎：极速跟手 (保持不变，这是手感的基础) ---
  const mouseX = useMotionValue(-1000);
  const mouseY = useMotionValue(-1000);

  const springConfig = { damping: 50, stiffness: 1000, mass: 0.05 };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // 这里的偏移量不需要太精确，因为我们在下面的 style 里会用 translate(-50%, -50%)
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  const handleEnterStudio = () => {
    setIsExiting(true);
    setTimeout(() => {
      router.push("/dashboard");
    }, 800);
  };

  return (
    <main className="flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-ecru relative">
      
      {/* 极淡磨砂层 (保持) */}
      <div className="pointer-events-none fixed inset-0 z-20 bg-noise" />

      {/* --- 核心升级：三层呼吸晕染系统 (The Living Ink) --- */}
      <motion.div
        className="pointer-events-none fixed z-0 top-0 left-0"
        style={{
          x: springX,
          y: springY,
        }}
      >
        {/* 这一层容器负责跟随鼠标，内部的 div 负责居中和渲染 */}
        <div className="relative -translate-x-1/2 -translate-y-1/2">
          
          {/* Layer 1: 迷雾层 (Mist) - 范围最大，颜色最淡，模拟边缘的水痕 */}
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[100px] mix-blend-multiply"
            style={{
              background: "rgba(45, 15, 21, 0.04)", // 极淡
            }}
          />

          {/* Layer 2: 晕染层 (Bloom) - 负责色彩的主体过渡 */}
          <motion.div 
            animate={{ scale: [1.1, 1, 1.1], opacity: [0.6, 0.8, 0.6] }} // 与上一层反向呼吸，制造流动感
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[80px] mix-blend-multiply"
            style={{
              background: "rgba(60, 20, 30, 0.15)", // 稍微透一点红
            }}
          />

          {/* Layer 3: 核心层 (Core) - 深沉的聚焦点 */}
          <motion.div 
             animate={{ scale: [1, 1.05, 1] }}
             transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
             className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] rounded-full blur-[50px] mix-blend-multiply"
             style={{
               background: "rgba(45, 15, 21, 0.25)", // 深酒红核心
             }}
          />
        </div>
      </motion.div>

      {/* 帷幕 */}
      {isExiting && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: "0%" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-50 bg-plum-wine"
        />
      )}

      {/* 内容区 */}
      <div className="z-30 flex flex-col items-center text-center px-4 relative">
        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5 }}
          className="text-3xl md:text-5xl font-light tracking-[0.25em] text-plum-wine uppercase leading-tight"
        >
          Aesthetic <br className="md:hidden" /> English
        </motion.h1>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 flex flex-col items-center gap-5"
        >
          <div className="h-[1px] w-10 bg-plum-wine/40" />
          <p className="font-serif italic text-lg text-plum-wine/70 tracking-widest">
            — Beauty and Brains —
          </p>
        </motion.div>

        <motion.button
          onClick={handleEnterStudio}
          className="group mt-20 relative overflow-hidden px-10 py-4 transition-all cursor-pointer"
        >
          <span className="absolute inset-0 border border-plum-wine/20 group-hover:border-plum-wine transition-colors duration-500" />
          <span className="absolute inset-0 bg-plum-wine translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />

          <div className="relative flex items-center gap-3">
            <span className="text-[10px] uppercase tracking-[0.3em] text-plum-wine group-hover:text-ecru transition-colors duration-300">
              Enter Studio
            </span>
            <ArrowRight className="h-3 w-3 text-plum-wine group-hover:text-ecru transition-transform group-hover:translate-x-1 duration-300" />
          </div>
        </motion.button>
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
        className="absolute bottom-10 flex flex-col items-center gap-2 z-30"
      >
        <p className="text-[11px] md:text-xs uppercase tracking-[0.3em] text-plum-wine font-medium">
          Curated by Scarlett Zhang
        </p>
        <a 
          href="mailto:aestheticen@zyw.com" 
          className="text-[9px] tracking-[0.1em] text-plum-wine/50 hover:text-plum-wine transition-colors italic"
        >
          aestheticen@zyw.com
        </a>
      </motion.div>
    </main>
  );
}