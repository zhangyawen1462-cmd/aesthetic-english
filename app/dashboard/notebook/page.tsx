"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Search, Trash2, PlayCircle, Bookmark, Hash, MoreHorizontal } from "lucide-react";

// --- 模拟收藏的数据 ---
const COLLECTED_ITEMS = [
  { 
    id: 1, 
    type: "vocabulary", // 单词卡
    content: "Serendipity", 
    sub: "/ˌserənˈdɪpəti/",
    note: "The occurrence of events by chance in a happy or beneficial way.",
    tags: ["#Daily", "#Noun"],
    date: "Feb 09",
    color: "bg-[#1E293B] text-[#D8E3E7] border-[#D8E3E7]/20" // 深蓝配色
  },
  { 
    id: 2, 
    type: "sentence", // 金句卡
    content: "I brew my coffee, not for the caffeine, but for the ritual.",
    sub: "Morning Rituals - EP.01",
    note: "Great usage of 'not for... but for...'",
    tags: ["#Grammar", "#Speaking"],
    date: "Feb 08",
    color: "bg-[#F2EFE5] text-[#2D0F15] border-[#2D0F15]/10" // 米色配色 (经典纸张感)
  },
  { 
    id: 3, 
    type: "phrase", // 短语卡
    content: "Flow State",
    sub: "Cognitive Growth",
    note: "Mental state of operation in which a person performing an activity is fully immersed.",
    tags: ["#Psychology"],
    date: "Feb 07",
    color: "bg-[#D8E3E7] text-[#2D0F15] border-[#2D0F15]/10" // 浅蓝配色
  },
  { 
    id: 4, 
    type: "vocabulary", 
    content: "Ethereal", 
    sub: "/ɪˈθɪəriəl/",
    note: "Extremely delicate and light in a way that seems too perfect for this world.",
    tags: ["#Adjective", "#Art"],
    date: "Feb 06",
    color: "bg-[#1E293B] text-[#D8E3E7] border-[#D8E3E7]/20" // 深蓝
  },
];

export default function MyNotebook() {
  const [filter, setFilter] = useState("all");

  // 过滤逻辑
  const items = COLLECTED_ITEMS.filter(item => filter === "all" || item.type === filter);

  return (
    // 1. 大背景：深酒红 (Deep Plum Wine)
    <div className="min-h-screen w-full bg-[#2D0F15] selection:bg-[#D6CBB9] selection:text-[#2D0F15] relative overflow-hidden">
      
      {/* 2. 氛围灯光：顶部的聚光灯效果 (Radial Gradient) */}
      <div className="pointer-events-none fixed top-[-20%] left-1/2 -translate-x-1/2 h-[800px] w-[800px] rounded-full bg-[#F2EFE5]/5 blur-[120px]" />
      
      {/* 噪点纹理 (保持统一) */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-noise opacity-30 mix-blend-overlay" />

      {/* --- 顶部导航 --- */}
      <header className="sticky top-0 z-50 flex w-full items-center justify-between px-6 py-6 backdrop-blur-md border-b border-[#F2EFE5]/5 bg-[#2D0F15]/80">
        <Link 
          href="/dashboard" 
          className="group flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[#F2EFE5]/60 hover:text-[#F2EFE5] transition-colors"
        >
          <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-1" />
          <span>Close Notebook</span>
        </Link>
        <span className="text-[10px] tracking-widest text-[#F2EFE5]/30">PRIVATE COLLECTION</span>
      </header>

      <main className="relative z-10 mx-auto max-w-5xl px-6 py-12">

        {/* --- 头部信息 --- */}
        <div className="mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-serif text-5xl md:text-6xl italic text-[#F2EFE5] mb-4"
          >
            My Notebook
          </motion.h1>
          <p className="text-[#F2EFE5]/40 text-sm font-light font-serif italic max-w-lg">
            "A collection of thoughts, words, and moments worth keeping."
          </p>

          {/* 筛选器 */}
          <div className="mt-8 flex gap-4 border-b border-[#F2EFE5]/10 pb-4">
             {['all', 'vocabulary', 'sentence'].map((t) => (
               <button
                 key={t}
                 onClick={() => setFilter(t)}
                 className={`
                   text-[10px] uppercase tracking-widest transition-all pb-1
                   ${filter === t ? 'text-[#D6CBB9] border-b border-[#D6CBB9]' : 'text-[#F2EFE5]/30 hover:text-[#F2EFE5]/60'}
                 `}
               >
                 {t}
               </button>
             ))}
          </div>
        </div>

        {/* --- 瀑布流卡片 (Masonry Grid) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                className={`
                  relative group rounded-sm p-6 flex flex-col justify-between min-h-[220px]
                  shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-500
                  ${item.color} /* 这里应用深蓝/浅蓝/米色 */
                `}
              >
                {/* 装饰：别针/胶带效果 */}
                <div className="absolute top-[-8px] left-1/2 -translate-x-1/2 w-12 h-3 bg-[#F2EFE5]/20 rotate-2 backdrop-blur-sm" />

                {/* 卡片顶部：类型与操作 */}
                <div className="flex justify-between items-start opacity-60 mb-6">
                  <div className="flex items-center gap-2">
                    <Bookmark size={12} />
                    <span className="text-[9px] uppercase tracking-widest">{item.type}</span>
                  </div>
                  <button className="hover:text-red-400 transition-colors">
                    <MoreHorizontal size={14} />
                  </button>
                </div>

                {/* 卡片内容 */}
                <div>
                  <h3 className="font-serif text-2xl leading-tight mb-2">
                    {item.content}
                  </h3>
                  
                  {/* 音标或来源 */}
                  <p className="text-xs opacity-60 font-mono tracking-wide mb-4">
                    {item.sub}
                  </p>
                  
                  {/* 笔记区域 (Note) */}
                  <div className="relative pl-3 border-l-2 border-current/20 py-1">
                     <p className="text-xs opacity-80 font-serif italic leading-relaxed">
                       {item.note}
                     </p>
                  </div>
                </div>

                {/* 底部：标签与日期 */}
                <div className="mt-6 flex items-center justify-between opacity-50 text-[9px] uppercase tracking-wider">
                  <div className="flex gap-2">
                    {item.tags.map(tag => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                  <span>{item.date}</span>
                </div>

                {/* 悬停显示的播放按钮 (如果是句子或单词) */}
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                   <PlayCircle size={24} className="cursor-pointer hover:scale-110 transition-transform" />
                </div>

              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* 空状态 */}
        {items.length === 0 && (
          <div className="py-20 text-center text-[#F2EFE5]/20 italic font-serif">
            Your notebook is empty. Go to the Studio to collect moments.
          </div>
        )}

      </main>
    </div>
  );
}