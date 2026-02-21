"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [isExiting, setIsExiting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // --- 🎨 核心色板定义 ---
  // Paper: #F7F8F9 (明信片白)
  // Ink:   #2D0F15 (纯正酒红)

  // --- 物理引擎（仅桌面端启用） ---
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 50, stiffness: 1000, mass: 0.05 };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);

  useEffect(() => {
    // 检测是否为移动设备
    const checkMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    setIsMobile(checkMobile);

    if (typeof window !== 'undefined') {
        mouseX.set(window.innerWidth / 2);
        mouseY.set(window.innerHeight / 2);
    }

    // 🚀 移动端优化：禁用交互式动画，使用静态位置
    if (checkMobile) {
      return; // 移动端不监听任何事件
    }

    // 仅桌面端启用鼠标跟随
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [mouseX, mouseY]);

  const handleEnterStudio = () => {
    setIsExiting(true);
    setTimeout(() => router.push("/dashboard"), 800);
  };

  return (
    // ✅ 1. 背景升级：基础色 #F7F8F9 + 内阴影模拟纸张厚度
    <main 
      className="flex h-[100dvh] w-full flex-col items-center justify-center overflow-hidden bg-[#F7F8F9] relative shadow-[inset_0_0_120px_rgba(0,0,0,0.02)]"
    >

      {/* ✅ 2. 艺术纸质感层 (Art Paper Texture) - 移动端简化 */}
      {!isMobile && (
        <div className="pointer-events-none fixed inset-0 z-10 opacity-[0.6] mix-blend-multiply"
             style={{
               backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='paper-grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='0 0 0 0 0.9  0 0 0 0 0.9  0 0 0 0 0.9  0 0 0 0 1'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23paper-grain)' opacity='0.4'/%3E%3C/svg%3E")`,
               filter: 'contrast(120%) brightness(105%)'
             }} 
        />
      )}
      
      {/* ✅ 3. 物理光影层 (Vignette) */}
      {/* 模拟光线打在纸面上的漫反射，中间亮四周暗，增加明信片的实体感 */}
      <div className="pointer-events-none fixed inset-0 z-10"
           style={{
             background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.8) 0%, rgba(247,248,249,0) 60%, rgba(45,15,21,0.03) 100%)'
           }}
      />

      {/* 三层呼吸晕染系统 - 移动端优化 */}
      {isMobile ? (
        // 移动端：静态渐变，无动画
        <div className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center">
          <div className="w-[80vw] h-[80vw] rounded-full blur-[60px] mix-blend-multiply opacity-60"
               style={{ background: "rgba(45, 15, 21, 0.15)" }} 
          />
        </div>
      ) : (
        // 桌面端：完整交互式动画
        <motion.div
          className="pointer-events-none fixed z-0 top-0 left-0"
          style={{ x: springX, y: springY }}
        >
          <div className="relative -translate-x-1/2 -translate-y-1/2">
            <motion.div
              animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[100px] mix-blend-multiply"
              style={{ background: "rgba(45, 15, 21, 0.12)" }} 
            />
            <motion.div
              animate={{ scale: [1.1, 1, 1.1], opacity: [0.6, 0.8, 0.6] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[80px] mix-blend-multiply"
              style={{ background: "rgba(45, 15, 21, 0.18)" }} 
            />
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] rounded-full blur-[50px] mix-blend-multiply"
              style={{ background: "rgba(45, 15, 21, 0.25)" }}
            />
          </div>
        </motion.div>
      )}

      {/* 帷幕转场 (保持不变) */}
      {isExiting && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: "0%" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-50 bg-[#2D0F15]"
        />
      )}

      {/* 内容区 */}
      <div className="z-30 flex flex-col items-center text-center px-6 relative">

        {/* 主标题 */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5 }}
          className="font-serif text-[2rem] md:text-[3.2rem] font-normal tracking-[0.15em] text-[#2D0F15] uppercase leading-[1.1] mix-blend-multiply"
        >
          Aesthetic{" "}
          <br className="md:hidden" />
          English
        </motion.h1>

        {/* 副标题 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-6 md:mt-8 flex flex-col items-center gap-4"
        >
          <div className="h-[1px] w-10 bg-[#2D0F15]/30" />
          <p className="font-serif text-base md:text-lg text-[#2D0F15]/60 tracking-[0.08em]">
            — Beauty and Brains —
          </p>
        </motion.div>

        {/* CTA 按钮 */}
        <motion.button
          onClick={handleEnterStudio}
          className="group mt-16 md:mt-20 relative overflow-hidden px-10 py-4 transition-all cursor-pointer touch-active"
        >
          <span className="absolute inset-0 border border-[#2D0F15]/20 group-hover:border-[#2D0F15] transition-colors duration-500" />
          <span className="absolute inset-0 bg-[#2D0F15] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
          <div className="relative flex items-center gap-3">
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#2D0F15] group-hover:text-[#F7F8F9] transition-colors duration-300 font-medium">
              Enter Studio
            </span>
            <ArrowRight className="h-3 w-3 text-[#2D0F15] group-hover:text-[#F7F8F9] transition-all group-hover:translate-x-1 duration-300" strokeWidth={1.5} />
          </div>
        </motion.button>
      </div>

      {/* 底部署名 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
        className="absolute bottom-8 md:bottom-10 flex flex-col items-center gap-2 z-30 safe-bottom"
      >
        <p className="text-[10px] md:text-[11px] uppercase tracking-[0.2em] text-[#2D0F15]/60 font-medium">
          Curated by Scarlett Zhang
        </p>
        <a
          href="mailto:aestheticenglish@outlook.com"
          className="text-[9px] tracking-[0.1em] text-[#2D0F15]/35 hover:text-[#2D0F15]/70 transition-colors"
        >
          aestheticenglish@outlook.com
        </a>
      </motion.div>
    </main>
  );
}