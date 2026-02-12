"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Play, ArrowUpRight, ArrowRight } from "lucide-react";

// --- 1. 数据接口：增加 ratio 字段 ---
interface DailyCourse {
  id: string;
  vol: string;
    categoryTags: string[];
    author: string;
    titleEN: string;
  titleCN: string;
  image: string;
    ratio: "aspect-[3/4]" | "aspect-[9/16]" | "aspect-square"; // 核心：控制比例
    type: "video" | "image";
}

// --- 2. 模拟数据 (混合比例) ---
const DAILY_FEED: DailyCourse[] = [
    {
        id: "daily-001",
        vol: "Vol.01",
        categoryTags: ["MAKEUP", "VLOG"],
        author: "Scarlett",
        titleEN: "The Morning Ritual",
        titleCN: "晨间唤醒的词汇艺术",
        image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=800&auto=format&fit=crop",
        ratio: "aspect-[3/4]",
        type: "video"
    },
    {
        id: "daily-002",
        vol: "Vol.00",
        categoryTags: ["FASHION"],
        author: "Daily",
        titleEN: "Quiet Moment",
        titleCN: "静谧时刻",
        image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=800&auto=format&fit=crop",
        ratio: "aspect-square",
        type: "image"
    },
    {
        id: "daily-003",
        vol: "Vol.03",
        categoryTags: ["VLOG", "FASHION"],
        author: "Monocle",
        titleEN: "Subway Inner Voice",
        titleCN: "地铁里的内心独白",
        image: "https://images.unsplash.com/photo-1470163395405-d2b80e7450ed?q=80&w=800&auto=format&fit=crop",
        ratio: "aspect-[3/4]",
        type: "video"
    },
    {
        id: "daily-004",
        vol: "Vol.02",
        categoryTags: ["FASHION"],
        author: "Vogue",
        titleEN: "Old Money Style",
        titleCN: "如何描述面料与剪裁",
        image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop",
        ratio: "aspect-[9/16]",
        type: "image"
    },
    {
        id: "daily-005",
        vol: "Vol.04",
        categoryTags: ["VLOG"],
        author: "AD",
        titleEN: "Rainy Day Reading",
        titleCN: "雨天书房的静谧时刻",
        image: "https://images.unsplash.com/photo-1507842217121-ca7633be5f43?q=80&w=800&auto=format&fit=crop",
        ratio: "aspect-[9/16]",
        type: "image"
    },
    {
        id: "daily-006",
        vol: "Vol.05",
        categoryTags: ["MAKEUP", "FASHION"],
        author: "Kinfolk",
        titleEN: "Cafe Conversations",
        titleCN: "点单与闲聊的高级表达",
        image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=800&auto=format&fit=crop",
        ratio: "aspect-[3/4]",
        type: "video"
    }
];

export default function DailyCinemaView() {
    // 简单分流：偶数左边，奇数右边
    const leftCol = DAILY_FEED.filter((_, i) => i % 2 === 0);
    const rightCol = DAILY_FEED.filter((_, i) => i % 2 !== 0);

  return (
        <div className="min-h-screen w-full bg-[#F7F8F9] text-[#2D0F15] relative overflow-x-hidden">
            {/* 全局纹理 */}
            <div
                className="pointer-events-none fixed inset-0 z-0 opacity-[0.03] mix-blend-multiply"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }}
            />
      
            {/* ── Header ── */}
            <header className="fixed top-0 left-0 right-0 z-50 px-4 md:px-5 py-3 md:py-4 flex items-center justify-between bg-[#F7F8F9]/90 backdrop-blur-md border-b border-[#2D0F15]/5 shadow-[0_1px_3px_rgba(45,15,21,0.1)]">
                <Link href="/dashboard" className="opacity-60 hover:opacity-100 transition-opacity">
                    <ArrowLeft size={18} className="md:w-5 md:h-5" strokeWidth={1} />
                </Link>
                <h1 className="text-[14px] md:text-[20px] uppercase tracking-[0.2em] md:tracking-[0.25em] font-bold text-[#2D0F15]">Daily Aesthetic</h1>
                <div className="w-[18px] md:w-5" />
            </header>

            {/* ── Main Content: 双列错位流 ── */}
            <main className="pt-28 md:pt-20 pb-12 md:pb-20 max-w-[880px] mx-auto relative z-10 min-h-screen overflow-y-auto scale-[1] md:scale-[1.1] origin-top">

                {/* === 核心：极细中轴线 (The Spine) === */}
                <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-[#2D0F15]/10 -translate-x-1/2 z-0 pointer-events-none" />

                <div className="flex w-full px-2 md:px-4">

                    {/* 左列 (Left Column) - 独立滚动 + 下移 */}
                    <div className="w-1/2 flex flex-col gap-2 md:gap-4 pr-2 md:pr-6 overflow-y-auto max-h-screen mt-12 md:mt-20">
                        {leftCol.map((item, index) => (
                            <DailyCard key={item.id} item={item} index={index} />
                        ))}
                    </div>

                    {/* 右列 (Right Column) - 独立滚动 + 上移 */}
                    <div className="w-1/2 flex flex-col gap-2 md:gap-4 pl-2 md:pl-6 -mt-4 md:-mt-6 overflow-y-auto max-h-screen">
                        {rightCol.map((item, index) => (
                            <DailyCard key={item.id} item={item} index={index} />
                        ))}
                    </div>

          </div>

                {/* End of Feed */}
                <div className="mt-20 md:mt-32 py-8 md:py-10 text-center relative z-10 bg-[#F7F8F9]">
                    <Link href="/archives?filter=daily" className="group inline-block relative overflow-hidden px-8 md:px-10 py-3 md:py-4 transition-all cursor-pointer">
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

            </main>
    </div>
  );
}

// ─── 卡片组件 ───
function DailyCard({ item, index }: { item: DailyCourse; index: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "50px" }}
            transition={{ duration: 0.8, delay: index * 0.1, type: "spring" }}
            className="group flex flex-col gap-2 md:gap-3 cursor-pointer relative"
        >
            {/* 1. 图片容器 (根据 ratio 变化高度) */}
            <Link href={`/course/daily/${item.id}`} className={`block relative w-full ${item.ratio} overflow-hidden rounded-[2px] bg-[#E5E5E5] shadow-sm`}>
                <img
                    src={item.image}
                    alt={item.titleEN}
                    className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out scale-[1.3] group-hover:scale-[1.35]"
                />

                {/* 视频标记 (如果是视频，中心显示极简 Play) */}
                {item.type === "video" && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-40 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="w-8 h-8 rounded-full bg-[#F7F8F9]/30 backdrop-blur-md flex items-center justify-center border border-white/20">
                            <Play size={10} fill="white" className="text-white ml-0.5" />
                        </div>
                    </div>
                )}
            </Link>

            {/* 2. 文字区 */}
            <div className="flex flex-col px-0.5">
                {/* 分类标签区域 - 预留给后续上传的数据 */}
                <div className="flex flex-wrap gap-1 mb-1 md:mb-1.5">
                    {item.categoryTags.map(tag => (
                        <span key={tag} className="text-[8px] md:text-[9px] uppercase tracking-wider text-[#2D0F15]">{tag}</span>
                    ))}
                </div>

                <Link href={`/course/daily/${item.id}`}>
                    <h3 className="font-sans text-[14px] md:text-[19px] leading-[1.2] text-[#2D0F15] mb-0.5 md:mb-1 group-hover:opacity-70 transition-opacity uppercase tracking-wide">
                        {item.titleEN}
                    </h3>
                </Link>

                <p className="font-sans text-[11px] md:text-[14px] text-[#2D0F15] tracking-wide line-clamp-1">
                    {item.titleCN}
                </p>
            </div>
        </motion.div>
    );
}