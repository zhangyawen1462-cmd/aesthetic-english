"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Trash2, PlayCircle, Bookmark } from "lucide-react";
import type { CollectedItem } from "@/data/types";
import { getNotebook, removeFromNotebook } from "@/lib/notebook-store";

// 类型 → 卡片配色
const TYPE_COLORS: Record<string, string> = {
  vocabulary: "bg-[#1E293B] text-[#D8E3E7] border-[#D8E3E7]/20",
  sentence:   "bg-[#F2EFE5] text-[#2D0F15] border-[#2D0F15]/10",
  grammar:    "bg-[#D8E3E7] text-[#2D0F15] border-[#2D0F15]/10",
};

export default function MyNotebook() {
  const [filter, setFilter] = useState("all");
  const [items, setItems] = useState<CollectedItem[]>([]);

  // 从 localStorage 读取真实收藏数据
  useEffect(() => {
    setItems(getNotebook());
  }, []);

  // 过滤逻辑
  const filteredItems = items.filter(item => filter === "all" || item.type === filter);

  // 删除收藏
  const handleDelete = (id: string) => {
    removeFromNotebook(id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  return (
    <div className="min-h-screen w-full bg-[#2D0F15] selection:bg-[#D6CBB9] selection:text-[#2D0F15] relative overflow-hidden">

      {/* 氛围灯光 */}
      <div className="pointer-events-none fixed top-[-20%] left-1/2 -translate-x-1/2 h-[800px] w-[800px] rounded-full bg-[#F2EFE5]/5 blur-[120px]" />

      {/* 噪点纹理 */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-noise opacity-30 mix-blend-overlay" />

      {/* 顶部导航 */}
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

        {/* 头部信息 */}
        <div className="mb-16">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-serif text-5xl md:text-6xl italic text-[#F2EFE5] mb-4"
          >
            My Notebook
          </motion.h1>
          <p className="text-[#F2EFE5]/40 text-sm font-light font-serif italic max-w-lg">
            &quot;A collection of thoughts, words, and moments worth keeping.&quot;
          </p>

          {/* 筛选器 */}
          <div className="mt-8 flex gap-4 border-b border-[#F2EFE5]/10 pb-4">
            {['all', 'vocabulary', 'sentence', 'grammar'].map((t) => (
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

        {/* 卡片网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredItems.map((item, index) => (
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
                  ${TYPE_COLORS[item.type] || TYPE_COLORS.vocabulary}
                `}
              >
                {/* 装饰：别针效果 */}
                <div className="absolute top-[-8px] left-1/2 -translate-x-1/2 w-12 h-3 bg-[#F2EFE5]/20 rotate-2 backdrop-blur-sm" />

                {/* 卡片顶部 */}
                <div className="flex justify-between items-start opacity-60 mb-6">
                  <div className="flex items-center gap-2">
                    <Bookmark size={12} />
                    <span className="text-[9px] uppercase tracking-widest">{item.type}</span>
                  </div>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    title="Remove from notebook"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* 卡片内容 */}
                <div>
                  <h3 className="font-serif text-2xl leading-tight mb-2">
                    {item.content}
                  </h3>

                  {item.sub && (
                    <p className="text-xs opacity-60 font-mono tracking-wide mb-4">
                      {item.sub}
                    </p>
                  )}

                  {item.note && (
                    <div className="relative pl-3 border-l-2 border-current/20 py-1">
                      <p className="text-xs opacity-80 font-serif italic leading-relaxed">
                        {item.note}
                      </p>
                    </div>
                  )}
                </div>

                {/* 底部：来源与日期 */}
                <div className="mt-6 flex items-center justify-between opacity-50 text-[9px] uppercase tracking-wider">
                  <span>From: {item.lessonId}</span>
                  <span>{item.date}</span>
                </div>

                {/* 悬停播放按钮（如果有时间戳） */}
                {item.timestamp !== undefined && (
                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <PlayCircle size={24} className="cursor-pointer hover:scale-110 transition-transform" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* 空状态 */}
        {filteredItems.length === 0 && (
          <div className="py-20 text-center text-[#F2EFE5]/20 italic font-serif">
            {items.length === 0
              ? "Your notebook is empty. Go to the Studio to collect moments."
              : "No items match this filter."}
          </div>
        )}

      </main>
    </div>
  );
}
