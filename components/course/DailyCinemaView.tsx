"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Play, ArrowUpRight, ArrowRight } from "lucide-react";
import type { Lesson } from "@/data/types";
import { useSubscriptionGuard } from "@/lib/hooks/useSubscriptionGuard";
import SubscriptionModal from "@/components/SubscriptionModal";
import { useMembership } from "@/context/MembershipContext";

// --- 1. 数据接口：增加 ratio 字段 ---
interface DailyCourse {
  id: string;
  vol: string;
  categoryTags: string[];
  author: string;
  titleEN: string;
  titleCN: string;
  image: string;
  ratio: "aspect-[3/4]" | "aspect-[9/16]" | "aspect-square" | "aspect-video"; // 核心：控制比例
  type: "video" | "image";
  isSample?: boolean | 'freeTrial'; // 🆕 添加 isSample 字段
}

// 槽位配置 - 与 layout-manager 保持一致
const SLOT_CONFIG = [
  { ratio: "aspect-[9/16]", type: "image" },   // slot-0: 左列第一个
  { ratio: "aspect-square", type: "video" },   // slot-1: 右列第一个
  { ratio: "aspect-[3/4]", type: "video" },    // slot-2: 左列第二个
  { ratio: "aspect-[9/16]", type: "image" },   // slot-3: 右列第二个
  { ratio: "aspect-square", type: "image" },   // slot-4: 左列第三个
  { ratio: "aspect-[3/4]", type: "video" },    // slot-5: 右列第三个
];

// 将 Lesson 转换为 DailyCourse
function lessonToDailyCourse(lesson: Lesson, index: number): DailyCourse {
  const slotConfig = SLOT_CONFIG[index] || { ratio: "aspect-[3/4]", type: "video" };
  
  // 优先使用数据库中的 coverRatio，如果没有则使用槽位配置
  let ratio: "aspect-[3/4]" | "aspect-[9/16]" | "aspect-square" | "aspect-video" = slotConfig.ratio as any;
  
  if (lesson.coverRatio) {
    ratio = lesson.coverRatio === '3/4' ? "aspect-[3/4]" :
            lesson.coverRatio === '9/16' ? "aspect-[9/16]" :
            lesson.coverRatio === '16/9' ? "aspect-video" :
            lesson.coverRatio === '1/1' ? "aspect-square" :
            lesson.coverRatio === 'square' ? "aspect-square" :
            "aspect-square";
  }
  
  return {
    id: lesson.id,
    vol: lesson.ep ? `Vol.${lesson.ep}` : `Vol.${index + 1}`,
    categoryTags: lesson.category ? [lesson.category.toUpperCase()] : [],
    author: "Daily",
    titleEN: lesson.titleEn || "",
    titleCN: lesson.titleCn || "",
    image: lesson.coverImg,
    ratio,
    type: lesson.videoUrl ? "video" : "image",
    isSample: lesson.isSample, // 🆕 传递 isSample
  };
}

export default function DailyCinemaView() {
  const [slots, setSlots] = useState<(DailyCourse | null)[]>(new Array(6).fill(null));
  const [isLoading, setIsLoading] = useState(true);
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  // 游客拦截系统
  const { shouldShowSubscription, handleCourseClick, closeSubscriptionModal } = useSubscriptionGuard();
  
  // 获取会员状态
  const { tier } = useMembership();

  // 从 API 获取数据
  useEffect(() => {
    async function fetchDailyCinemaLayout() {
      try {
        const response = await fetch('/api/daily-cinema-layout');
        const data = await response.json();
        
        if (data.success && data.data) {
          // 创建一个长度为6的空数组（6个槽位）
          const newSlots: (DailyCourse | null)[] = new Array(6).fill(null);
          
          // 根据 sortOrder 放到对应位置
          data.data.forEach((lesson: Lesson) => {
            const position = lesson.sortOrder ?? 0;
            if (position >= 0 && position < 6) {
              newSlots[position] = lessonToDailyCourse(lesson, position);
            }
          });
          
          setSlots(newSlots);
        }
      } catch (error) {
        console.error('Failed to fetch daily cinema layout:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchDailyCinemaLayout();
  }, []);

  // 简单分流：偶数左边，奇数右边（基于槽位索引）
  const leftCol = slots.filter((_, i) => i % 2 === 0);  // 0, 2, 4
  const rightCol = slots.filter((_, i) => i % 2 !== 0); // 1, 3, 5

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-[#F7F8F9] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#2D0F15] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#2D0F15] text-sm opacity-60">加载中...</p>
        </div>
      </div>
    );
  }

  // 检查是否所有槽位都为空
  const hasContent = slots.some(slot => slot !== null);

  if (!hasContent) {
    return (
      <div className="min-h-screen w-full bg-[#F7F8F9] flex flex-col items-center justify-center px-6">
        {/* 全局纹理 */}
        <div
          className="pointer-events-none fixed inset-0 z-0 opacity-[0.03] mix-blend-multiply"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }}
        />
        
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 px-4 md:px-5 py-3 md:py-4 flex items-center justify-between bg-[#F7F8F9]/90 backdrop-blur-md border-b border-[#2D0F15]/5">
          <Link href="/dashboard" className="opacity-60 hover:opacity-100 transition-opacity">
            <ArrowLeft size={18} className="md:w-5 md:h-5" strokeWidth={1} />
          </Link>
          <h1 className="text-[14px] md:text-[20px] uppercase tracking-[0.2em] md:tracking-[0.25em] font-bold text-[#2D0F15]">Daily Aesthetic</h1>
          <div className="w-[18px] md:w-5" />
        </header>

        {/* 空状态提示 */}
        <div className="text-center text-[#2D0F15]/60 relative z-10">
          <div className="mb-6 opacity-20">
            <Play size={64} className="mx-auto" />
          </div>
          <h2 className="text-2xl font-serif mb-3 text-[#2D0F15]">暂无内容</h2>
          <p className="text-sm mb-6 opacity-60">请在后台上传课程后刷新页面</p>
          <Link 
            href="/admin/publish" 
            className="inline-block text-xs uppercase tracking-wider px-6 py-3 border border-[#2D0F15]/20 hover:bg-[#2D0F15] hover:text-[#F7F8F9] transition-all"
          >
            前往上传
          </Link>
        </div>
      </div>
    );
  }

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

            {/* ── Main Content: 双列同步滑动 ── */}
            <main className="pt-28 md:pt-20 pb-12 md:pb-20 max-w-[880px] mx-auto relative z-10 min-h-screen">

                {/* === 核心：极细中轴线 (The Spine) === */}
                <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-[#2D0F15]/10 -translate-x-1/2 z-0 pointer-events-none" />

                <div className="flex w-full px-2 md:px-4 gap-2 md:gap-8">

          {/* 左列 */}
                    <div className="w-1/2 flex flex-col gap-2 md:gap-4">
            {leftCol.map((item, index) => (
              item && <DailyCard key={item.id} item={item} index={index * 2} onGuestClick={handleCourseClick} onImageClick={setViewingImage} tier={tier} />
            ))}
          </div>

          {/* 右列 */}
                    <div className="w-1/2 flex flex-col gap-2 md:gap-4">
            {rightCol.map((item, index) => (
              item && <DailyCard key={item.id} item={item} index={index * 2 + 1} onGuestClick={handleCourseClick} onImageClick={setViewingImage} tier={tier} />
            ))}
          </div>

        </div>

        {/* End of Feed */}
                <div className="mt-20 md:mt-32 py-8 md:py-10 text-center relative z-10 bg-[#F7F8F9]">
          {tier === 'visitor' || tier === 'trial' ? (
            <button 
              onClick={handleCourseClick}
              className="group inline-block relative overflow-hidden px-8 md:px-10 py-3 md:py-4 transition-all cursor-pointer"
            >
              <span className="absolute inset-0 border border-[#2D0F15]/20 group-hover:border-[#2D0F15] transition-colors duration-500" />
              <span className="absolute inset-0 bg-[#2D0F15] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
              <div className="relative flex items-center gap-2 md:gap-3">
                <span className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] md:tracking-[0.25em] text-[#2D0F15] group-hover:text-[#F7F8F9] transition-colors duration-300 font-medium">
                  Full Archive
                </span>
                <ArrowRight className="h-2.5 w-2.5 md:h-3 md:w-3 text-[#2D0F15] group-hover:text-[#F7F8F9] transition-all group-hover:translate-x-1 duration-300" strokeWidth={1.5} />
              </div>
            </button>
          ) : (
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
          )}
        </div>

      </main>

      {/* 游客拦截弹窗 */}
      <SubscriptionModal 
        isOpen={shouldShowSubscription} 
        onClose={closeSubscriptionModal} 
      />

      {/* 图片查看器 */}
      <motion.div
        initial={false}
        animate={viewingImage ? { opacity: 1, pointerEvents: 'auto' as any } : { opacity: 0, pointerEvents: 'none' as any }}
        onClick={() => setViewingImage(null)}
        className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 cursor-zoom-out"
      >
        {viewingImage && (
          <motion.img
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            src={viewingImage}
            alt="查看大图"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        )}
        <button
          onClick={() => setViewingImage(null)}
          className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft size={32} strokeWidth={1} className="rotate-180" />
        </button>
      </motion.div>
    </div>
  );
}

// ─── 卡片组件 ───
function DailyCard({ item, index, onGuestClick, onImageClick, tier }: { 
  item: DailyCourse; 
  index: number; 
  onGuestClick?: () => void;
  onImageClick?: (img: string) => void;
  tier?: string | null;
}) {
    // 判断是否为纯图片卡片（无标题且不可点击跳转）
    const isImageCard = item.type === 'image' && !item.titleCN && !item.titleEN;
    
    // 所有有标题的都显示标题
    const hasTitle = item.titleCN || item.titleEN;
    
    // 🚪 游客：所有视频都拦截；试用用户：只有 freeTrial 课程可以直接访问，其他拦截
    const shouldIntercept = tier === 'visitor' ? true : (tier === 'trial' ? item.isSample !== 'freeTrial' : false);
    
    // 🔍 调试日志 - 仅在开发环境输出
    if (process.env.NODE_ENV === 'development') {
      console.log('DailyCard:', {
        id: item.id,
        tier,
        isSample: item.isSample,
        shouldIntercept
      });
    }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "50px" }}
            transition={{ duration: 0.8, delay: index * 0.1, type: "spring" }}
            className={`relative ${isImageCard ? 'cursor-zoom-in' : 'group cursor-pointer'}`}
    >
            {/* 1. 图片容器 */}
            {isImageCard ? (
                // 纯图片卡片：点击放大
                <div 
                  className={`relative w-full ${item.ratio} overflow-hidden rounded-[2px] bg-[#E5E5E5] shadow-sm group`}
                  onClick={() => onImageClick?.(item.image)}
                >
                    <img
                        src={item.image}
                        alt="mood"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                </div>
            ) : (
                // 视频/课程：可点击跳转
                <Link 
                  href={shouldIntercept ? '#' : `/course/daily/${item.id}`}
                  onClick={(e) => {
                    if (shouldIntercept) {
                      e.preventDefault();
                      onGuestClick?.();
                    }
                  }}
                  className={`block relative w-full ${item.ratio} overflow-hidden rounded-[2px] bg-[#E5E5E5] shadow-sm`}
                >
        <img
          src={item.image}
          alt={item.titleEN}
                        className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-105"
        />

                    {/* 视频播放按钮 - 只在视频类型显示 */}
                    {item.type === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-40 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="w-8 h-8 rounded-full bg-[#F7F8F9]/30 backdrop-blur-md flex items-center justify-center border border-white/20">
                            <Play size={10} fill="white" className="text-white ml-0.5" />
            </div>
          </div>
                    )}
      </Link>
            )}

            {/* 2. 文字区 - 只有有标题的显示 */}
            {hasTitle && !isImageCard && (
                <div className="flex flex-col px-0.5 mt-2 md:mt-3">
        <Link 
          href={shouldIntercept ? '#' : `/course/daily/${item.id}`}
          onClick={(e) => {
            if (shouldIntercept) {
              e.preventDefault();
              onGuestClick?.();
            }
          }}
        >
                        {/* 中文大标题 */}
                        {item.titleCN && (
                        <h3 className="font-serif text-[16px] md:text-[22px] leading-[1.2] text-[#2D0F15] mb-1 group-hover:opacity-70 transition-opacity" style={{ fontFamily: 'PingFang SC, -apple-system, sans-serif' }}>
                            {item.titleCN}
                        </h3>
                        )}
                        {/* 英文小标题 */}
                        {item.titleEN && (
                        <p className="font-sans text-[11px] md:text-[13px] text-[#2D0F15]/60 tracking-wide uppercase">
            {item.titleEN}
                        </p>
                        )}
        </Link>
      </div>
            )}
    </motion.div>
  );
}