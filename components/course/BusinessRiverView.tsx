"use client";

import React from "react";
import Link from "next/link";
import { Archive, ArrowLeft } from "lucide-react";

interface Course {
  id: string;
  vol: string;
  titleCN: string;
  titleEN: string;
  duration: string;
  image: string;
  desc: string;
}

interface BusinessRiverViewProps {
  data: Course[];
  category: string;
}

/**
 * The Vertical River (纵向河流) - 用于 Business
 * 特点：向上滑动，3:4 视频封面
 */
export default function BusinessRiverView({ data, category }: BusinessRiverViewProps) {
  return (
    <div className="min-h-screen w-full bg-[#F5F5F7] overflow-y-scroll snap-y snap-mandatory scroll-smooth no-scrollbar">
      {/* 悬浮栏 */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-5 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
          <ArrowLeft size={16} strokeWidth={1} className="text-[#1A0505]" />
        </Link>
        <h1 className="text-[10px] uppercase tracking-[0.25em] font-medium text-[#1A0505]">Business</h1>
        <div className="w-6" />
      </header>
        
        {/* 课程卡片 */}
        {data.map((course) => (
        <section 
          key={course.id} 
          className="w-full h-screen snap-start shrink-0 flex items-center justify-center p-8 md:p-20"
        >
          <Link href={`/course/${category}/${course.id}`} className="w-full max-w-2xl">
            <div className="flex flex-col group cursor-pointer">
              {/* 图片区 - 3:4 比例 */}
              <div className="relative w-full aspect-[3/4] overflow-hidden bg-white">
                <img 
                  src={course.image} 
                  alt={course.titleEN}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                />
                <div className="absolute inset-0 bg-[#1A0505]/0 group-hover:bg-[#1A0505]/10 transition-colors" />
              </div>
              
              {/* 标题区 */}
              <div className="pt-6 flex justify-between items-start">
                <div>
                  <h3 className="text-3xl md:text-4xl font-serif text-[#1A0505] mb-2">{course.titleCN}</h3>
                  <p className="text-xs uppercase tracking-widest text-[#1A0505]/60">{course.titleEN}</p>
                </div>
                <span className="font-mono text-xs opacity-40">{course.duration}</span>
              </div>
            </div>
          </Link>
        </section>
        ))}

        {/* Archive 卡片 (最后一个) */}
      <section className="w-full h-screen snap-start shrink-0 flex items-center justify-center bg-[#1A0505] text-[#F5F5F7]">
        <Link href="/archives" className="text-center cursor-pointer hover:opacity-80 transition-opacity">
          <Archive size={48} strokeWidth={0.5} className="mx-auto mb-6 opacity-50" />
          <span className="text-3xl font-serif italic block">全部归档</span>
          <span className="text-[9px] uppercase tracking-[0.3em] mt-2 opacity-50 block">Business Archive</span>
        </Link>
      </section>
    </div>
  );
}
