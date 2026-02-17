"use client";

import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Menu, X, Play } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import * as React from "react";
import type { Lesson } from "@/data/types";



export default function Dashboard() {
  const containerRef = useRef(null);
  const { scrollY } = useScroll();
  
  // 控制手机菜单的状态
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // 从 API 获取布局配置的课程
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardLayout() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/dashboard-layout');
        const data = await response.json();
        if (data.success) {
          setLessons(data.data);
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
        console.error('Failed to fetch dashboard layout:', error);
        }
      } finally {
        setIsLoading(false);
      }
    }
    fetchDashboardLayout();
  }, []);

  // 转换为 VISUAL_STREAM 格式（按 sortOrder 放到正确位置）
  const VISUAL_STREAM = lessons.length > 0 
    ? (() => {
        // 创建一个长度为 8 的空数组
        const stream: (VisualStreamItem | undefined)[] = new Array(8).fill(undefined);
        
        // 根据 sortOrder 放到对应位置
        lessons.forEach((lesson) => {
          const position = lesson.sortOrder || 0;
          if (position >= 0 && position < 8) {
            // 判断是否为纯图片卡片
            const isImageCard = !lesson.videoUrl && !lesson.titleCn && !lesson.titleEn;
            
            // 获取比例
            const getHeight = () => {
              if (lesson.coverRatio) {
                return lesson.coverRatio === '3/4' ? 'aspect-[3/4]' :
                       lesson.coverRatio === '1/1' ? 'aspect-square' :
                       'aspect-[9/16]';
              }
              return 'aspect-square'; // 默认
            };
            
            stream[position] = {
        id: lesson.id,
              type: isImageCard ? "mood" : "episode",
              category: lesson.category?.toUpperCase() || '',
              title: lesson.titleEn || lesson.titleCn || 'Untitled',
              img: lesson.coverImg || '/images/daily-sketch.jpg',
              height: getHeight(),
              ep: lesson.ep || '00',
              href: isImageCard ? '#' : `/course/${lesson.category}/${lesson.id}`,
            };
          }
        });
        
        return stream;
      })()
    : [];

  // 修复滚动穿透：当菜单打开时锁定 body 滚动
  useEffect(() => {
    if (isMobileMenuOpen) {
      // 锁定 body 滚动
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
      document.body.style.height = "100%";
    } else {
      // 恢复滚动
      document.body.style.overflow = "unset";
      document.body.style.position = "unset";
      document.body.style.width = "unset";
      document.body.style.height = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
      document.body.style.position = "unset";
      document.body.style.width = "unset";
      document.body.style.height = "unset";
    };
  }, [isMobileMenuOpen]);

  /* ✅ 水印标题 (Sticky & Fade) */
  const headerOpacity = useTransform(scrollY, [0, 500], [1, 0.08]);
  const headerBlur = useTransform(scrollY, [0, 500], ["0px", "8px"]);
  const headerScale = useTransform(scrollY, [0, 500], [1, 0.95]);

  return (
    <div
      ref={containerRef}
      className="min-h-screen w-full bg-[#F7F8F9] text-[#2D0F15] relative selection:bg-[#2D0F15] selection:text-[#F7F8F9]"
    >
      {/* 纹理层 */}
      <div 
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.04] mix-blend-multiply" 
        style={{
             backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='paper-fine'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23paper-fine)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* ── 顶部导航 ── */}
      <header className="fixed top-0 z-50 w-full px-6 py-5 flex items-center justify-between mix-blend-multiply pointer-events-none">
        <Link
          href="/"
          className="group flex items-center gap-2 opacity-40 hover:opacity-100 transition-opacity duration-500 pointer-events-auto"
        >
          <ArrowLeft size={16} strokeWidth={1} className="group-hover:-translate-x-1 transition-transform text-[#2D0F15]" />
          <span className="hidden md:inline text-[9px] uppercase tracking-[0.2em] font-sans text-[#2D0F15]">
            Landing
          </span>
        </Link>

        {/* 手机端菜单按钮 */}
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="md:hidden pointer-events-auto flex items-center gap-2 opacity-60 active:opacity-100 text-[#2D0F15]"
        >
          <Menu size={20} strokeWidth={1} />
        </button>

      </header>

      {/* 手机端侧滑抽屉 (The Plum Wine Drawer) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* 黑色遮罩 (点击关闭) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 z-[60] bg-[#101211] md:hidden backdrop-blur-[2px]"
            />

            {/* 侧滑内容区 (铺满整个屏幕, Plum Wine 纯色背景) */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: "0%" }}
              exit={{ x: "-100%" }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 35,
                mass: 1 
              }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={{ left: 0.1, right: 0 }}
              onDragEnd={(e, { offset, velocity }) => {
                 if (offset.x < -100 || velocity.x < -500) setIsMobileMenuOpen(false);
              }}
              className="fixed inset-0 z-[70] bg-[#2D0F15] text-[#F7F8F9] flex flex-col justify-center items-center p-8 md:hidden overflow-hidden"
            >
              {/* 轻微噪点纹理 */}
              <div 
                 className="absolute inset-0 pointer-events-none opacity-[0.02]" 
                 style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }} 
              />

              {/* 中间：目录列表 - 完全居中 */}
              <nav className="flex flex-col gap-6 relative z-10 items-center justify-center">
                 {[
                   { label: "Daily Aesthetics", href: "/course/daily", isMain: true },
                   { label: "Cognitive Growth", href: "/course/cognitive", isMain: true },
                   { label: "Business Female", href: "/course/business", isMain: true }
                 ].map((item, i) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + (i * 0.05), duration: 0.5 }}
                    >
                      <Link 
                        href={item.href} 
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="group flex items-center justify-center pb-4"
                      >
                         <span className="text-[#150609] opacity-90 text-center text-4xl font-serif font-bold tracking-[0.25em] uppercase" style={{ WebkitTextStroke: "1px #F7F8F9", textShadow: "-1.5px -1.5px 0 #000000, 1.5px -1.5px 0 #000000, -1.5px 1.5px 0 #000000, 1.5px 1.5px 0 #000000, 0 -1.5px 0 #000000, 0 1.5px 0 #000000, -1.5px 0 0 #000000, 1.5px 0 0 #000000" }}>
                           {item.label}
                         </span>
                      </Link>
                    </motion.div>
                 ))}
              </nav>

              {/* 底部：Notes 和 Subscribe - 固定在底部 */}
              <div className="absolute bottom-8 left-0 right-0 z-10 flex flex-col items-center gap-4">
                 <Link 
                   href="/dashboard/notebook" 
                   onClick={() => setIsMobileMenuOpen(false)}
                   className="text-[10px] uppercase tracking-[0.25em] text-[#F7F8F9] underline font-medium hover:opacity-70 transition-opacity"
                 >
                   Notes
                 </Link>
                 <Link 
                   href="/subscribe" 
                   onClick={() => setIsMobileMenuOpen(false)}
                   className="text-[10px] uppercase tracking-[0.25em] text-[#F7F8F9] underline font-medium hover:opacity-70 transition-opacity"
                 >
                   Subscribe
                 </Link>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── 标题：大字号 + 固定水印 ── */}
      <motion.section
        style={{ 
          opacity: headerOpacity, 
          filter: `blur(${headerBlur as any})`, 
          scale: headerScale 
        }}
        className="fixed top-28 left-0 w-full px-6 z-[5] md:z-0 pointer-events-none origin-top-left bg-[#F7F8F9] md:bg-transparent"
      >
        <h1 className="font-serif font-bold text-[13vw] md:text-[9.5rem] leading-[0.85] tracking-[-0.04em] text-[#2D0F15] mix-blend-multiply">
          Aesthetic <br /> English
        </h1>
      </motion.section>

      {/* 占位高度 */}
      <div className="h-[40vh] md:h-[50vh] w-full pointer-events-none" />

      {/* ── 核心布局 ── */}
      <main className="relative z-10 px-0 grid grid-cols-1 md:grid-cols-12 min-h-screen pb-20">
        
        {/* === 左侧菜单 (Index) - 仅网页端显示 === */}
        <aside className="hidden md:flex md:col-span-5 p-10 sticky top-[15vh] h-[70vh] flex-col justify-between mix-blend-multiply z-20 -translate-y-12">
          <div /> 
          <ul className="space-y-0 w-full text-right pr-18"> 
            {["Daily", "Cognitive", "Business"].map((item) => (
              <li key={item} className="group relative w-full flex justify-end">
                <Link href={`/course/${item.toLowerCase()}`} className="block relative z-10">
                  <span className="font-serif text-[2.75rem] md:text-[3.25rem] block transition-all duration-500 group-hover:italic cursor-pointer text-[#2D0F15] hover:opacity-70 tracking-tight">
                    {item}
                  </span>
                </Link>
              </li>
            ))}
            <li className="pt-8 mt-4 border-t border-[#2D0F15]/10">
              <Link href="/dashboard/notebook" className="block text-right group">
                <span className="font-serif text-4xl italic text-[#2D0F15]/60 group-hover:text-[#2D0F15] transition-colors">
                  Notes
                </span>
              </Link>
            </li>
          </ul>
          <div className="w-full flex justify-end pr-18">
            <span className="font-sans text-[9px] uppercase tracking-[0.25em] opacity-40 text-[#2D0F15]">
              Subscribe
            </span>
          </div>
        </aside>

        {/* === 右侧：瀑布流 (Right High, Left Low) === */}
        <div className="col-span-1 md:col-span-7 px-5 md:px-0 md:pr-12 mt-6 md:-mt-20 md:-ml-20">
          
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-[#2D0F15] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : lessons.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <div className="mb-6 opacity-20">
                <Play size={64} className="mx-auto text-[#2D0F15]" />
              </div>
              <h2 className="text-2xl font-serif mb-3 text-[#2D0F15]">暂无内容</h2>
              <p className="text-sm mb-6 text-[#2D0F15]/60">请在后台上传课程后刷新页面</p>
              <Link 
                href="/admin/publish" 
                className="inline-block text-xs uppercase tracking-wider px-6 py-3 border border-[#2D0F15]/20 hover:bg-[#2D0F15] hover:text-[#F7F8F9] transition-all"
              >
                前往上传
              </Link>
            </div>
          ) : (
          <>
          {/* 移动端：单列布局 - 先左列后右列 */}
          <div className="flex flex-col gap-9 md:hidden">
            {/* 左列：0, 1, 2, 3 */}
            {VISUAL_STREAM[0] && (VISUAL_STREAM[0].type === 'episode' ? <EpisodeCard item={VISUAL_STREAM[0]} index={0} /> : <MoodCard item={VISUAL_STREAM[0]} index={0} />)}
            {VISUAL_STREAM[1] && (VISUAL_STREAM[1].type === 'episode' ? <EpisodeCard item={VISUAL_STREAM[1]} index={1} /> : <MoodCard item={VISUAL_STREAM[1]} index={1} />)}
            {VISUAL_STREAM[2] && (VISUAL_STREAM[2].type === 'episode' ? <EpisodeCard item={VISUAL_STREAM[2]} index={2} /> : <MoodCard item={VISUAL_STREAM[2]} index={2} />)}
            {VISUAL_STREAM[3] && (VISUAL_STREAM[3].type === 'episode' ? <EpisodeCard item={VISUAL_STREAM[3]} index={3} /> : <MoodCard item={VISUAL_STREAM[3]} index={3} />)}
            {/* 右列：4, 5, 6, 7 */}
            {VISUAL_STREAM[4] && (VISUAL_STREAM[4].type === 'episode' ? <EpisodeCard item={VISUAL_STREAM[4]} index={4} /> : <MoodCard item={VISUAL_STREAM[4]} index={4} />)}
            {VISUAL_STREAM[5] && (VISUAL_STREAM[5].type === 'episode' ? <EpisodeCard item={VISUAL_STREAM[5]} index={5} /> : <MoodCard item={VISUAL_STREAM[5]} index={5} />)}
            {VISUAL_STREAM[6] && (VISUAL_STREAM[6].type === 'episode' ? <EpisodeCard item={VISUAL_STREAM[6]} index={6} /> : <MoodCard item={VISUAL_STREAM[6]} index={6} />)}
            {VISUAL_STREAM[7] && (VISUAL_STREAM[7].type === 'episode' ? <EpisodeCard item={VISUAL_STREAM[7]} index={7} /> : <MoodCard item={VISUAL_STREAM[7]} index={7} />)}
          </div>

          {/* 网页端：双列布局 - 保持不变 */}
          <div className="hidden md:grid md:grid-cols-[1.4fr_1.6fr] gap-9">
            
            {/* 左列 (Left Low) */}
            <div className="flex flex-col gap-9 pt-32">
               {VISUAL_STREAM[0] && (VISUAL_STREAM[0].type === 'episode' ? <EpisodeCard item={VISUAL_STREAM[0]} index={0} /> : <MoodCard item={VISUAL_STREAM[0]} index={0} />)}
               {VISUAL_STREAM[1] && (VISUAL_STREAM[1].type === 'episode' ? <EpisodeCard item={VISUAL_STREAM[1]} index={1} /> : <MoodCard item={VISUAL_STREAM[1]} index={1} />)}
               {VISUAL_STREAM[2] && (VISUAL_STREAM[2].type === 'episode' ? <EpisodeCard item={VISUAL_STREAM[2]} index={2} /> : <MoodCard item={VISUAL_STREAM[2]} index={2} />)}
               {VISUAL_STREAM[3] && (VISUAL_STREAM[3].type === 'episode' ? <EpisodeCard item={VISUAL_STREAM[3]} index={3} /> : <MoodCard item={VISUAL_STREAM[3]} index={3} />)}
            </div>

            {/* 右列 (Right High) */}
            <div className="flex flex-col gap-9 pt-4">
               {VISUAL_STREAM[4] && (VISUAL_STREAM[4].type === 'episode' ? <EpisodeCard item={VISUAL_STREAM[4]} index={4} /> : <MoodCard item={VISUAL_STREAM[4]} index={4} />)}
               {VISUAL_STREAM[5] && (VISUAL_STREAM[5].type === 'episode' ? <EpisodeCard item={VISUAL_STREAM[5]} index={5} /> : <MoodCard item={VISUAL_STREAM[5]} index={5} />)}
               {VISUAL_STREAM[6] && (VISUAL_STREAM[6].type === 'episode' ? <EpisodeCard item={VISUAL_STREAM[6]} index={6} /> : <MoodCard item={VISUAL_STREAM[6]} index={6} />)}
               {VISUAL_STREAM[7] && (VISUAL_STREAM[7].type === 'episode' ? <EpisodeCard item={VISUAL_STREAM[7]} index={7} /> : <MoodCard item={VISUAL_STREAM[7]} index={7} />)}
            </div>

          </div>
          </>
          )}

        </div>
      </main>

      <footer className="py-8 text-center border-t border-[#2D0F15]/5 opacity-40 relative z-10 bg-[#F7F8F9]">
        <p className="text-[8px] uppercase tracking-[0.3em] font-sans text-[#2D0F15]">
          Created by Scarlett Zhang
        </p>
      </footer>
    </div>
  );
}

// ─── 类型定义 ───
interface VisualStreamItem {
  id: string;
  type: string;
  category?: string;
  title?: string;
  img: string;
  height: string;
  ep?: string;
  href?: string;
  caption?: string;
}

// ─── 辅助函数：将 Tailwind aspect 类名转换为 CSS aspect-ratio 值 ───
function getAspectRatio(heightClass: string | undefined): number {
  if (!heightClass) return 1;
  if (heightClass === 'aspect-[3/4]') return 3 / 4;
  if (heightClass === 'aspect-square') return 1;
  if (heightClass === 'aspect-[9/16]') return 9 / 16;
  if (heightClass === 'aspect-video') return 16 / 9;
  if (heightClass === 'aspect-[4/3]') return 4 / 3;
  return 1; // 默认方形
}

// ─── 子组件定义 (确保这些在 Dashboard 函数外部) ───
function EpisodeCard({ item, index }: { item: VisualStreamItem; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 0 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.6, delay: 0, ease: [0.22, 1, 0.36, 1] }}
      className="group cursor-pointer w-full"
    >
      <Link href={item.href || "#"}>
        <div 
          className="relative w-full overflow-hidden bg-[#2D0F15]/5"
          style={{ aspectRatio: getAspectRatio(item.height) }}
        >
          <img 
            src={item.img} 
            alt={item.title} 
            onError={(e) => {
              e.currentTarget.src = '/images/daily-sketch.jpg';
            }}
            className="w-full h-full object-cover transition-transform duration-[1.2s] group-hover:scale-105" 
          />
        </div>
        <div className="mt-5 pr-2">
          <p className="text-[9px] uppercase tracking-[0.2em] text-[#2D0F15]/40 mb-3">{item.category} — EP.{item.ep}</p>
          <h3 className="font-serif text-3xl md:text-3xl text-[#2D0F15] leading-[1.1] group-hover:italic transition-all">{item.title}</h3>
        </div>
      </Link>
    </motion.div>
  );
}

function MoodCard({ item, index }: { item: VisualStreamItem; index: number }) {
  const [aspectRatio, setAspectRatio] = React.useState<number>(1);
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1, delay: index * 0.1 }}
      className="pointer-events-none select-none relative w-full"
    >
      <div 
        className="relative w-full overflow-hidden bg-[#2D0F15]/5"
        style={{ aspectRatio }}
      >
        <img
          src={item.img}
          alt="mood"
          className="w-full h-full object-contain grayscale-[20%] opacity-90"
          onLoad={(e) => {
            const img = e.currentTarget;
            const ratio = img.naturalWidth / img.naturalHeight;
            setAspectRatio(ratio);
          }}
          onError={(e) => {
            e.currentTarget.src = '/images/daily-sketch.jpg';
          }}
        />
      </div>
    </motion.div>
  );
}
