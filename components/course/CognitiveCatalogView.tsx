"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowUpRight, ArrowRight } from "lucide-react";

interface Course {
  id: string;
  vol: string;
  titleCN: string;
  titleEN: string;
  duration: string;
  image: string;
  desc: string;
}

interface CognitiveCatalogViewProps {
  data: Course[];
  category: string;
}

export default function CognitiveCatalogView({ data, category }: CognitiveCatalogViewProps) {
  // 默认显示第一张图
  const defaultImage = data[0]?.image || ""; 
  const [hoveredCourse, setHoveredCourse] = useState<Course | null>(null);

  // 激活状态
  const activeImage = hoveredCourse?.image || defaultImage;
  const activeID = hoveredCourse?.id || "01";
  const activeTitle = hoveredCourse?.titleEN || "COGNITIVE";

  return (
    <div className="min-h-screen w-full bg-[#F7F8F9] text-[#2D0F15] font-sans selection:bg-[#2D0F15] selection:text-[#F7F8F9] flex flex-col md:flex-row relative">
      
      {/* 纹理层：增加纸张质感 */}
      <div 
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.03] mix-blend-multiply" 
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }} 
      />

      {/* ── Header ── */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 md:px-5 py-4 md:py-5 flex items-center justify-between bg-[#F7F8F9]/90 backdrop-blur-md border-b border-[#2D0F15]/5 shadow-[0_1px_3px_rgba(45,15,21,0.1)]">
        <Link href="/dashboard" className="opacity-60 hover:opacity-100 transition-opacity">
          <ArrowLeft size={18} className="md:w-5 md:h-5" strokeWidth={1} />
        </Link>
        <h1 className="text-[14px] md:text-[20px] uppercase tracking-[0.2em] md:tracking-[0.25em] font-bold text-[#2D0F15]">Cognitive Growth</h1>
        <div className="w-[18px] md:w-5" />
      </header>

      {/* ─── 左侧：画廊展示区 (Fixed Gallery) ─── */}
      <aside className="w-full md:w-[45vw] md:h-[calc(100vh+4rem)] md:fixed top-0 left-0 border-r border-[#2D0F15]/5 flex flex-col justify-between z-20 bg-[#F7F8F9] pt-20 md:pt-24">
        
        {/* 1. 顶部留白（为悬浮栏预留空间） */}
        <div className="p-8 md:p-12 flex justify-between items-start">
        </div>

        {/* 2. 中部：干净的图片 (The Clean Image) */}
        {/* 去掉了所有边框和阴影，只保留图片本身 */}
        <div className="flex-1 px-12 md:px-20 flex flex-col justify-center items-center -mt-8">
           <div className="relative w-full aspect-[3/4] max-w-[468px]">
             {/* 图片容器：简单的圆角 */}
             <div className="w-full h-full relative overflow-hidden rounded-[2px] bg-[#E5E5E5]">
               <AnimatePresence mode="wait">
                 <motion.img
                   key={activeImage}
                   initial={{ opacity: 0, scale: 1.05, filter: "blur(5px)" }}
                   animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                   exit={{ opacity: 0 }}
                   transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} // 优雅的缓动
                   src={activeImage}
                   className="absolute inset-0 w-full h-full object-cover" 
                 />
               </AnimatePresence>
             </div>
             
             {/* 图片下方的标题：大字号无衬线体 */}
             <div className="mt-8 text-center">
               <motion.h2 
                 key={activeTitle}
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="text-3xl md:text-5xl font-sans italic text-[#2D0F15] leading-tight"
               >
                 {activeTitle}
               </motion.h2>
             </div>
           </div>
        </div>

        {/* 3. 底部：装饰性页码 */}
        <div className="p-8 md:p-12 flex justify-between items-end opacity-30">
           <div className="text-[100px] leading-[0.8] font-sans -mb-4 -ml-2">
             {activeID}
           </div>
        </div>
      </aside>


      {/* ─── 右侧：极简清单 (The Minimalist List) ─── */}
      <main className="flex-1 md:ml-[45vw] min-h-screen relative z-10 bg-[#F7F8F9] pt-20 md:pt-24">
        
        {/* 顶部留白 */}
        <div className="h-4 md:h-12" />

        <div className="px-6 md:px-2 pb-32 md:-ml-16 -mt-20">

          {/* 列表项 */}
          <div className="flex flex-col gap-0">
            {data.map((course, index) => (
              <Link key={course.id} href={`/course/${category}/${course.id}`}>
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  onMouseEnter={() => setHoveredCourse(course)}
                  onMouseLeave={() => setHoveredCourse(null)}
                  className="group relative flex items-baseline py-8 border-t border-[#2D0F15]/5 cursor-pointer transition-all duration-300 px-2 hover:px-0 overflow-hidden"
                >
                  
                  {/* 背景帷幕效果 - 从左往右滑入 */}
                  <span className="absolute inset-0 bg-[#2D0F15] -translate-x-full group-hover:translate-x-0 transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)]" />
                  
                  {/* 1. 序号：单色，极简 */}
                  <span className="relative w-16 text-xs font-mono opacity-30 group-hover:opacity-100 group-hover:text-[#F7F8F9] transition-all">
                    {(index + 1).toString().padStart(2, '0')}
                  </span>

                  {/* 2. 标题：英文正常，中文小一号 */}
                  <div className="relative flex-1 flex flex-col gap-2 md:gap-3 transition-transform duration-500 group-hover:translate-x-4 pr-4">
                    <h3 className="text-xl md:text-2xl font-sans text-[#2D0F15] group-hover:text-[#F7F8F9] group-hover:italic transition-all duration-300">
                      {course.titleEN}
                    </h3>
                    <span className="text-lg md:text-xl font-sans text-[#2D0F15]/60 group-hover:text-[#F7F8F9]/80 transition-colors">
                      {course.titleCN}
                    </span>
                  </div>

                  {/* 3. 尾部：箭头与时长 */}
                  <div className="relative flex items-center justify-end w-20 gap-4">
                     <span className="font-mono text-xs opacity-30 group-hover:opacity-100 group-hover:text-[#F7F8F9] transition-all">{course.duration}</span>
                     <ArrowUpRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-[#2D0F15] group-hover:text-[#F7F8F9]" />
                  </div>

                </motion.div>
              </Link>
            ))}
          </div>

          {/* 底部 Archive 按钮 */}
          <div className="mt-20 md:mt-32 py-8 md:py-10 text-center relative z-10 bg-[#F7F8F9] overflow-hidden">
            <Link href="/archives?filter=cognitive" className="group inline-block relative overflow-hidden px-8 md:px-10 py-3 md:py-4 transition-all cursor-pointer">
              <span className="absolute inset-0 border border-[#2D0F15]/20 group-hover:border-[#2D0F15] transition-colors duration-500" />
              <span className="absolute inset-0 bg-[#2D0F15] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
              <div className="relative flex items-center gap-2 md:gap-3">
                <span className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] md:tracking-[0.25em] text-[#2D0F15] group-hover:text-[#F7F8F9] transition-colors duration-300 font-medium">
                  Full Archive
                </span>
                <ArrowRight className="h-2.5 w-2.5 md:h-3 md:w-3 text-[#2D0F15] group-hover:text-[#F7F8F9] transition-all group-hover:translate-x-1 duration-300" strokeWidth={1.5} />
              </div>
            </Link>
          </div>

        </div>
      </main>
    </div>
  );
}