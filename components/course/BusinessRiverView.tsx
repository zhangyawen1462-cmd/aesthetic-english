"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Play, Info, Lock } from "lucide-react";
import type { Lesson } from "@/data/types";
import { useMembership } from "@/context/MembershipContext";
import { checkVideoAccess } from "@/lib/permissions";
import { useSubscriptionGuard } from "@/lib/hooks/useSubscriptionGuard";
import SubscriptionModal from "@/components/SubscriptionModal";

interface BusinessRiverViewProps {
  category: string;
}

export default function BusinessRiverView({ category }: BusinessRiverViewProps) {
  // 背景图：横屏和竖屏
  const MANHATTAN_BG_LANDSCAPE = "/images/businessbg_横屏.avif"; // 横屏背景
  const MANHATTAN_BG_PORTRAIT = "/images/businessbg_竖屏.avif"; // 竖屏背景
  
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLandscape, setIsLandscape] = useState(true);

  // 🔐 获取会员状态
  const { tier } = useMembership();
  const hasAccess = checkVideoAccess(tier, 'business', false);

  // 游客拦截系统
  const { shouldShowSubscription, handleCourseClick, closeSubscriptionModal } = useSubscriptionGuard();

  // 监听屏幕方向变化
  useEffect(() => {
    const handleOrientationChange = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };

    handleOrientationChange(); // 初始化
    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  // 从 API 获取课程数据
  useEffect(() => {
    async function fetchLessons() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/business-featured-layout');
        const data = await response.json();
        if (data.success) {
          setLessons(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch lessons:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchLessons();
  }, []);

  // 只取前两期，保证只有两期
  const featuredData = lessons.slice(0, 2);

  return (
    <div className="min-h-screen w-full bg-[#2D0F15] text-[#F7F8F9] relative font-sans selection:bg-[#F7F8F9] selection:text-[#2D0F15]">
      
      {/* ─── 层级 1: 曼哈顿夜景背景 (The Atmosphere) ─── */}
      <div className="fixed inset-0 z-0">
        {/* 图片层 - 根据屏幕方向切换背景 */}
        <div className="w-full h-full">
          <img 
            src={isLandscape ? MANHATTAN_BG_LANDSCAPE : MANHATTAN_BG_PORTRAIT} 
            alt="Manhattan Skyline" 
            className="w-full h-full object-cover transition-opacity duration-500"
          />
          {/* 深色遮罩层 */}
          <div className="absolute inset-0 bg-[#2D0F15]/40" />
        </div>
      </div>


      {/* ─── 层级 2: UI 内容 ─── */}
      <div className="relative z-10 w-full min-h-screen flex flex-col">
        
        {/* Header */}
        <header className="px-4 md:px-8 py-6 md:py-8 flex justify-between items-start">
          <Link href="/dashboard" className="group flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
            <ArrowLeft size={18} className="md:w-5 md:h-5 text-[#F7F8F9]" />
          </Link>
          
          {/* 右上角：BUSINESS FEMALE */}
          <div className="text-right">
            <span 
              className="text-[18px] md:text-[28px] font-serif font-black text-[#2D0F15] block leading-tight" 
              style={{ 
                WebkitTextStroke: '0.5px #F7F8F9',
                textShadow: '0 0 2px rgba(0,0,0,0.8), 0 0 3px rgba(0,0,0,0.6)',
                fontWeight: 900
              }}
            >
              BUSINESS FEMALE
            </span>
            {tier === 'visitor' || tier === 'trial' ? (
              <button 
                onClick={handleCourseClick}
                className="inline-block -mt-1 md:-mt-2"
              >
                <span className="text-[10px] md:text-[15px] uppercase tracking-[0.15em] md:tracking-[0.2em] font-medium text-[#2D0F15] hover:opacity-70 transition-opacity cursor-pointer">
                  Full Archive
                </span>
              </button>
            ) : (
              <Link href="/archives?filter=business" className="inline-block -mt-1 md:-mt-2">
                <span className="text-[10px] md:text-[15px] uppercase tracking-[0.15em] md:tracking-[0.2em] font-medium text-[#2D0F15] hover:opacity-70 transition-opacity cursor-pointer">
                  Full Archive
                </span>
              </Link>
            )}
          </div>
        </header>

        {/* Main: 两张卡片的展示台 - 移动端单列，桌面端双列 */}
        <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-16 px-4 md:px-20 pb-12 md:pb-20">
          
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-[#F7F8F9] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : featuredData.length === 0 ? (
            <div className="text-center text-[#F7F8F9]/60 px-6">
              <div className="mb-4 opacity-30">
                <Play size={48} className="mx-auto" />
              </div>
              <p className="text-lg mb-2">暂无课程</p>
              <p className="text-sm opacity-60">请在后台上传课程后刷新页面</p>
            </div>
          ) : (
            <>
          {featuredData.map((course, index) => {
            const isActive = index === activeIndex;
            // 移动端始终显示，桌面端使用 hover 效果
            const isMobileActive = true;
            
            // 🔐 检查权限（区分 Sample 和完整课程）
            const isSample = course.isSample || false;
            const hasAccessToCourse = checkVideoAccess(tier, 'business', isSample);
            
            // 🚪 游客：所有视频都拦截；试用用户：只有 freeTrial 课程可以直接访问，其他拦截
            const shouldIntercept = tier === 'visitor' ? true : (tier === 'trial' ? isSample !== 'freeTrial' : false);
            
            return (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2, duration: 0.6 }}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                className={`relative group cursor-pointer transition-all duration-700 w-full md:w-auto ${isActive ? 'md:flex-[1.5] opacity-100' : 'md:flex-1 md:opacity-20 md:hover:opacity-40 opacity-100'}`}
              >
                <Link 
                  href={shouldIntercept ? '#' : `/course/${category}/${course.id}`}
                  onClick={(e) => {
                    if (shouldIntercept) {
                      e.preventDefault();
                      handleCourseClick();
                    }
                  }}
                  className="block w-full"
                >
                  
                  {/* 卡片容器：16:9 比例 */}
                  <div className={`relative w-full aspect-video overflow-hidden shadow-2xl transition-all duration-700 ${isActive ? 'md:scale-105 shadow-[#F7F8F9]/10' : 'scale-100'}`}>
                    {/* 图片 */}
                    <img 
                      src={course.coverImg} 
                      alt={course.titleEn} 
                      className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-105"
                    />
                    
                    {/* 激活时的光泽层 */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-[#2D0F15]/80 via-transparent to-transparent opacity-60" />

                    {/* 🔒 锁图标 - 访客和试用用户不显示锁，其他会员显示 */}
                    {!hasAccessToCourse && tier !== 'trial' && tier !== null && (
                      <div className="absolute top-3 right-3 z-20 group/lock">
                        <div className="w-10 h-10 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center border border-white/30 shadow-lg">
                          <Lock size={18} className="text-white" />
                        </div>
                        {/* Tooltip */}
                        <div className="absolute top-12 right-0 opacity-0 group-hover/lock:opacity-100 transition-opacity bg-black/90 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap pointer-events-none">
                          订阅会员解锁
                        </div>
                      </div>
                    )}

                    {/* 播放按钮 - 移动端始终显示，桌面端仅激活时显示 */}
                    <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isActive || isMobileActive ? 'opacity-100 md:opacity-100' : 'md:opacity-0'}`}>
                      <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-[#F7F8F9]/10 backdrop-blur-md border border-[#F7F8F9]/30 flex items-center justify-center">
                        <Play size={20} className="md:w-6 md:h-6" fill="currentColor" />
                      </div>
                    </div>
                  </div>

                  {/* 倒影效果 (Reflection) - 桌面端显示 */}
                  <div className="hidden md:block relative w-full h-12 mt-1 overflow-hidden opacity-30 mask-image-linear-gradient">
                     <img 
                        src={course.coverImg} 
                        className="w-full aspect-video object-cover transform scale-y-[-1] blur-sm opacity-50" 
                     />
                     <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#2D0F15]" />
                  </div>

                  {/* 文字信息 - 移动端在卡片下方，桌面端在底部浮动 */}
                  <div className="mt-4 md:mt-0 md:absolute md:-bottom-16 left-0 right-0 transition-all duration-500 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-hover:translate-y-0 md:-translate-y-4">
                     <h3 className="text-lg md:text-2xl font-serif text-[#F7F8F9] leading-tight mb-1" style={{ fontFamily: 'PingFang SC, -apple-system, sans-serif' }}>
                       {course.titleCn}
                     </h3>
                     <p className="text-base md:text-2xl font-serif text-[#F7F8F9] leading-tight opacity-60">{course.titleEn}</p>
                  </div>

                </Link>
              </motion.div>
            );
          })}
          </>
          )}
        </div>

      </div>

      {/* 游客拦截弹窗 */}
      <SubscriptionModal 
        isOpen={shouldShowSubscription} 
        onClose={closeSubscriptionModal} 
      />
    </div>
  );
}