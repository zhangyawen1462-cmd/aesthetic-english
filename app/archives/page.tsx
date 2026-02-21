"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";
import Link from "next/link";
import { Search, Lock, ChevronDown } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Lesson } from "@/data/types";
import { useMembership } from "@/context/MembershipContext";
import { checkVideoAccess } from "@/lib/permissions";

// 主题配置
const THEMES = {
  white: {
    id: 'white',
    name: 'White',
    displayName: 'Paper White',
    bg: '#F7F8F9',
    text: '#2D0F15',
    accent: '#0A1628',
    secondary: '#EEEFF0',
  },
  blue: {
    id: 'blue',
    name: 'Blue',
    displayName: 'Midnight Blue',
    bg: '#0A1628',
    text: '#E8F4F8',
    accent: '#E8F4F8',
    secondary: '#1E3A5F',
  },
  wine: {
    id: 'wine',
    name: 'Wine',
    displayName: 'Plum Wine',
    bg: '#2D0F15',
    text: '#F7F8F9',
    accent: '#E8F4F8',
    secondary: '#4A2A30',
  },
};

function ArchiveContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeFilter, setActiveFilter] = useState(searchParams.get("filter") || "daily");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTheme, setCurrentTheme] = useState<keyof typeof THEMES>('white');
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9); // 默认网页端
  const [isPageTransitioning, setIsPageTransitioning] = useState(false);
  
  // 🔐 获取会员状态
  const { tier } = useMembership();
  
  // 🌊 物理拉拽状态
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const touchStartY = useRef(0);
  const scrollTopAtStart = useRef(0);
  const mainRef = useRef<HTMLDivElement>(null);
  
  // 响应式设置每页显示数量
  useEffect(() => {
    const updateItemsPerPage = () => {
      setItemsPerPage(window.innerWidth < 768 ? 6 : 9);
    };
    
    updateItemsPerPage();
    window.addEventListener('resize', updateItemsPerPage);
    return () => window.removeEventListener('resize', updateItemsPerPage);
  }, []);
  
  const theme = THEMES[currentTheme];

  // 从 API 获取所有课程数据
  useEffect(() => {
    async function fetchLessons() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/lessons', {
          cache: 'no-store', // 🔥 强制不使用缓存
        });
        const result = await response.json();
        
        if (result.success) {
          console.log('📚 Fetched lessons:', result.data.length);
          console.log('🔍 Sample lessons:', result.data.filter((l: Lesson) => l.isSample).map((l: Lesson) => ({ id: l.id, isSample: l.isSample })));
          setLessons(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch lessons:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLessons();
  }, []);

  // 过滤逻辑（不做权限过滤，显示所有课程）
  const filteredItems = lessons.filter(item => {
    const matchesFilter = activeFilter === "all" || item.category === activeFilter;
    const matchesSearch = 
      item.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.titleCn.includes(searchQuery) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    // 🔓 Archives 显示所有课程，权限检查在课程详情页进行
    return matchesFilter && matchesSearch;
  });

  // 分页逻辑
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredItems.slice(startIndex, endIndex);
  
  // 当过滤条件或搜索改变时，重置到第一页
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, searchQuery]);
  
  // 🌊 下拉换页物理引擎
  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;
    
    const handleTouchStart = (e: TouchEvent) => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      touchStartY.current = e.touches[0].clientY;
      scrollTopAtStart.current = scrollTop;
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const touchY = e.touches[0].clientY;
      const deltaY = touchY - touchStartY.current;
      
      // 只在页面底部且向上滑动时触发
      const isAtBottom = (window.innerHeight + scrollTop) >= (document.documentElement.scrollHeight - 100);
      
      if (isAtBottom && deltaY < 0 && currentPage < totalPages) {
        setIsPulling(true);
        // 粘滞系数：用户滑动10px，实际只拉动1.5px
        const resistance = 0.15;
        const distance = Math.abs(deltaY) * resistance;
        setPullDistance(Math.min(distance, 80)); // 最大拉动80px
        e.preventDefault();
      }
    };
    
    const handleTouchEnd = () => {
      if (isPulling && pullDistance > 50 && currentPage < totalPages) {
        // 突破临界点，触发换页
        setIsPageTransitioning(true);
        setTimeout(() => {
          setCurrentPage(prev => prev + 1);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          setIsPageTransitioning(false);
        }, 300);
      }
      setIsPulling(false);
      setPullDistance(0);
    };
    
    main.addEventListener('touchstart', handleTouchStart, { passive: true });
    main.addEventListener('touchmove', handleTouchMove, { passive: false });
    main.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      main.removeEventListener('touchstart', handleTouchStart);
      main.removeEventListener('touchmove', handleTouchMove);
      main.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isPulling, pullDistance, currentPage, totalPages]);

  const CATEGORIES = [
    { id: 'daily', label: 'DAILY AESTHETIC', shortLabel: 'DAILY', locked: false },
    { 
      id: 'cognitive', 
      label: 'COGNITIVE GROWTH', 
      shortLabel: 'COGNITIVE', 
      locked: tier === 'quarterly' || tier === null,
      hasUnlockedContent: lessons.some(l => l.category === 'cognitive' && l.isSample)
    },
    { 
      id: 'business', 
      label: 'BUSINESS FEMALE', 
      shortLabel: 'BUSINESS', 
      locked: tier === 'quarterly' || tier === null,
      hasUnlockedContent: lessons.some(l => l.category === 'business' && l.isSample)
    },
  ];

  return (
    <div className="min-h-screen w-full font-sans transition-colors duration-500" style={{ backgroundColor: theme.bg, color: theme.text }}>
      
      {/* ─── VOGUE Style Header ─── */}
      <header className="sticky top-0 z-50 w-full transition-colors duration-500" style={{ backgroundColor: theme.bg, borderBottom: `1px solid ${theme.text}1A` }}>
        
        {/* Row 1: Logo & Utilities */}
        <div className="max-w-[1400px] mx-auto px-6 py-3 md:py-4 relative flex items-center justify-center">
            
            {/* 左侧：返回 Lobby */}
            <div className="absolute left-6 hidden md:block">
                <Link 
                    href="/dashboard" 
                    className="text-[10px] uppercase tracking-[0.2em] hover:underline underline-offset-4 transition-colors" 
                    style={{ 
                        color: theme.accent
                    }}
                >
                    Back to Lobby
                </Link>
          </div>

            {/* 中间：主 Logo */}
            <h1 
                className="font-serif text-2xl md:text-[50px] font-bold tracking-tighter text-center cursor-pointer hover:opacity-90 transition-opacity px-12"
                onClick={() => setActiveFilter('daily')}
                style={{ fontFamily: "'Didot', 'Bodoni MT', 'Noto Serif SC', serif", color: theme.text }}
            >
                AESTHETIC ENGLISH
            </h1>

            {/* 右侧：工具栏 */}
            <div className="absolute right-4 md:right-6 flex items-center gap-3 md:gap-6" style={{ color: theme.text }}>
                <button onClick={() => setIsSearchOpen(!isSearchOpen)} className="hover:opacity-60 transition-opacity touch-manipulation">
                    <Search size={18} className="md:w-5 md:h-5" strokeWidth={1.5} />
                </button>
                <button 
                    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')} 
                    className="hidden md:flex items-center gap-2 hover:opacity-60 transition-opacity"
                    title={viewMode === 'grid' ? 'Switch to List View' : 'Switch to Grid View'}
                >
                    {viewMode === 'grid' ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <line x1="3" y1="6" x2="21" y2="6"/>
                            <line x1="3" y1="12" x2="21" y2="12"/>
                            <line x1="3" y1="18" x2="21" y2="18"/>
                        </svg>
                    ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="3" y="3" width="7" height="7"/>
                            <rect x="14" y="3" width="7" height="7"/>
                            <rect x="3" y="14" width="7" height="7"/>
                            <rect x="14" y="14" width="7" height="7"/>
                        </svg>
                    )}
                </button>
            </div>
          </div>

        {/* Search Bar Overlay */}
        <AnimatePresence>
            {isSearchOpen && (
                <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden transition-colors duration-500"
                    style={{ borderTop: `1px solid ${theme.text}1A`, backgroundColor: theme.secondary }}
                >
                    <div className="max-w-[600px] mx-auto py-4 px-6 flex items-center gap-4">
                        <Search size={16} className="opacity-40" style={{ color: theme.text }} />
                        <input 
                            type="text" 
                            placeholder="SEARCH ARCHIVES..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-transparent text-sm uppercase tracking-widest outline-none"
                            style={{ color: theme.text }}
                            autoFocus
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Row 2: Navigation Ribbon */}
        <nav className="py-1 md:py-2 overflow-x-auto overflow-y-hidden no-scrollbar transition-colors duration-500" style={{ borderTop: `1px solid ${theme.text}1A` }}>
            <div className="max-w-[1400px] mx-auto px-6 flex justify-center items-center gap-6 md:gap-16 min-w-max h-[36px] md:h-auto">
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveFilter(cat.id)}
                        className="text-[13px] md:text-[15px] uppercase tracking-[0.1em] transition-colors relative group whitespace-nowrap touch-manipulation flex-shrink-0"
                        style={{ color: activeFilter === cat.id ? theme.text : `${theme.text}66` }}
                    >
                        <span className="md:hidden">{cat.shortLabel}</span>
                        <span className="hidden md:inline">{cat.label}</span>
                        {activeFilter === cat.id && (
                            <motion.div 
                                layoutId="underline" 
                                className="absolute -bottom-2 md:-bottom-4 left-0 right-0 h-[2px]" 
                                style={{ 
                                    backgroundColor: theme.accent
                                }} 
                            />
                        )}
                    </button>
            ))}
          </div>
        </nav>
      </header>

      {/* ─── Main Content Grid ─── */}
      <main ref={mainRef} className="max-w-[1400px] mx-auto px-4 md:px-6 py-8 md:py-20 min-h-screen relative">

        {/* 加载状态 */}
        {isLoading && (
          <div className="py-32 text-center">
            <p className="font-serif italic text-xl md:text-2xl opacity-40" style={{ color: theme.text }}>LOADING</p>
          </div>
        )}

        {/* 列表内容 - 带水滴坠落动画 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{
              type: "spring",
              mass: 1.2,        // 质量：稍重，带有势能
              stiffness: 80,    // 刚度：控制坠落速度
              damping: 15,      // 阻尼：低阻尼产生微弹跳
              duration: 0.6
            }}
          >
            {!isLoading && viewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 md:gap-x-8 gap-y-8 md:gap-y-12">
                {currentItems.map((item, index) => (
                  <ArchiveCard key={item.id} item={item} index={index} theme={theme} currentTheme={currentTheme} />
                ))}
              </div>
            )}

            {!isLoading && viewMode === 'list' && (
              <div className="flex flex-col gap-6">
                {currentItems.map((item, index) => (
                  <ArchiveListItem key={item.id} item={item} index={index} theme={theme} currentTheme={currentTheme} />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* 🌊 下拉换页指示器 - 水滴张力效果 */}
        {isPulling && currentPage < totalPages && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none z-50"
          >
            <motion.div
              animate={{
                scaleY: 1 + pullDistance / 100,
                opacity: pullDistance / 80
              }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <ChevronDown 
                size={32} 
                strokeWidth={1.5}
                style={{ 
                  color: theme.accent,
                  filter: `drop-shadow(0 2px 8px ${theme.accent}40)`
                }}
              />
            </motion.div>
            <motion.p
              animate={{ opacity: pullDistance > 50 ? 1 : 0.4 }}
              className="text-xs uppercase tracking-widest"
              style={{ color: theme.accent }}
            >
              {pullDistance > 50 ? '松开加载下一页' : '继续上拉'}
            </motion.p>
          </motion.div>
        )}

        {/* 分页控制 */}
        {!isLoading && filteredItems.length > 0 && totalPages > 1 && (
          <div className="mt-16 md:mt-20 flex justify-center">
            {/* 分页按钮 - 极简设计 */}
            <div className="flex items-center gap-12">
              <motion.button
                onClick={() => {
                  setIsPageTransitioning(true);
                  setTimeout(() => {
                    setCurrentPage(prev => Math.max(1, prev - 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    setIsPageTransitioning(false);
                  }, 300);
                }}
                disabled={currentPage === 1}
                whileHover={{ x: -4 }}
                whileTap={{ scale: 0.95 }}
                className="group relative overflow-hidden disabled:opacity-20 disabled:cursor-not-allowed transition-opacity"
              >
                <div className="flex items-center gap-3">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ color: theme.text }}>
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                  <span className="text-[10px] uppercase tracking-[0.25em] font-light" style={{ color: theme.text }}>Prev</span>
                </div>
              </motion.button>
              
              <motion.button
                onClick={() => {
                  setIsPageTransitioning(true);
                  setTimeout(() => {
                    setCurrentPage(prev => Math.min(totalPages, prev + 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    setIsPageTransitioning(false);
                  }, 300);
                }}
                disabled={currentPage === totalPages}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.95 }}
                className="group relative overflow-hidden disabled:opacity-20 disabled:cursor-not-allowed transition-opacity"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[10px] uppercase tracking-[0.25em] font-light" style={{ color: theme.text }}>Next</span>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ color: theme.text }}>
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </motion.button>
            </div>
          </div>
        )}

        {!isLoading && filteredItems.length === 0 && (
           <div className="py-32 text-center opacity-40">
              <p className="font-serif italic text-xl md:text-2xl" style={{ color: theme.text }}>No stories found.</p>
           </div>
        )}

      </main>

      {/* Footer */}
      <footer className="py-20 px-6 mt-20 transition-colors duration-500" style={{ backgroundColor: theme.text, color: theme.bg }}>
         <div className="max-w-[1400px] mx-auto flex flex-col items-center gap-8">
            <h2 className="font-serif text-3xl md:text-4xl tracking-tight">AESTHETIC ENGLISH</h2>
            <div className="flex gap-8 text-[10px] uppercase tracking-widest opacity-60">
                <span>Newsletter</span>
                <span>Contact</span>
                <span>Press</span>
            </div>
            <div className="w-full h-[1px] opacity-20 my-4" style={{ backgroundColor: theme.bg }} />
            <p className="text-[10px] opacity-40">© 2026 AESTHETIC ENGLISH. ALL RIGHTS RESERVED.</p>
         </div>
      </footer>

      {/* ─── The Fabric Swatch (面料色卡) ─── */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
        
        {/* 色卡按钮 */}
        <button
          onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
          className="relative group"
        >
          {/* 主色块 */}
          <div 
            className="w-10 h-10 rounded-sm shadow-lg transition-all duration-300 group-hover:scale-110"
            style={{ 
              backgroundColor: theme.bg,
              border: `2px solid ${theme.text}`,
              boxShadow: `0 4px 12px ${theme.text}40`
            }}
          >
            {/* 内部强调色小方块 */}
            <div 
              className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-[1px]"
              style={{ backgroundColor: theme.accent }}
            />
          </div>
        </button>

        {/* 色卡展开菜单 */}
        <AnimatePresence>
          {isThemeMenuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: 10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: 10 }}
              className="absolute bottom-0 right-16 flex flex-col gap-2 p-3 rounded-sm backdrop-blur-md shadow-2xl"
              style={{ 
                backgroundColor: `${theme.secondary}F5`,
                border: `1px solid ${theme.text}1A`
              }}
            >
              {Object.values(THEMES).map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setCurrentTheme(t.id as keyof typeof THEMES);
                    setIsThemeMenuOpen(false);
                  }}
                  className="group/swatch flex items-center gap-3 px-3 py-2 rounded-[2px] transition-all hover:scale-105"
                  style={{ 
                    backgroundColor: currentTheme === t.id ? `${theme.text}10` : 'transparent'
                  }}
                >
                  {/* 色卡样本 */}
                  <div 
                    className="relative w-8 h-8 rounded-[2px] transition-transform"
                    style={{ 
                      backgroundColor: t.bg,
                      border: `1.5px solid ${t.text}`,
                      boxShadow: `0 2px 6px ${t.text}30`
                    }}
                  >
                    <div 
                      className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-[1px]"
                      style={{ backgroundColor: t.accent }}
                    />
                  </div>
                  
                  {/* 名称 */}
                  <span 
                    className="text-[11px] uppercase tracking-wider font-medium"
                    style={{ color: currentTheme === t.id ? theme.accent : theme.text }}
                  >
                    {t.name}
                  </span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// 卡片组件 (网格视图)
function ArchiveCard({ item, index, theme, currentTheme }: { item: Lesson, index: number, theme: typeof THEMES.white, currentTheme: keyof typeof THEMES }) {
  // 使用 16:9 封面，如果没有则使用 3:4 封面
  const coverImage = item.coverImg16x9 || item.coverImg;
  
  // 🔐 获取会员状态
  const { tier } = useMembership();
  
  // 判断是否需要显示锁图标
  const needsLock = (item.category === 'cognitive' || item.category === 'business') && 
                    !item.isSample && 
                    (tier === 'quarterly' || tier === null);
  
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, scale: 0.95 }} 
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="group cursor-pointer"
    >
      <Link href={`/course/${item.category}/${item.id}`} className="block h-full">
        
        {/* 图片区域 - 统一 16:9 */}
        <div className="relative aspect-video w-full overflow-hidden mb-4 transition-colors duration-500" style={{ backgroundColor: theme.secondary }}>
          {coverImage ? (
             <img 
              src={coverImage} 
              alt={item.titleEn} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
             />
          ) : (
            <div className="w-full h-full flex items-center justify-center opacity-20">
              <span className="text-sm">No Image</span>
            </div>
          )}
          
          {/* 🔒 锁图标覆盖层 - 仅当需要时显示 */}
          {needsLock && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Lock size={20} className="text-white" />
              </div>
            </div>
          )}
        </div>

        {/* 文字区域 */}
        <div className="flex flex-col items-center text-center px-4">

            {/* Title (中文主标题) */}
            <h3 className="font-sans text-lg md:text-xl leading-[1.2] mb-2 transition-colors duration-500" style={{ fontFamily: "'PingFang SC', sans-serif", color: theme.text }}>
                {item.titleCn || item.titleEn}
            </h3>

            {/* Subtitle (英文副标题) */}
            <p className="font-serif text-sm md:text-base uppercase tracking-wider opacity-60 transition-colors duration-500" style={{ color: theme.text }}>
                {item.titleEn}
            </p>
        </div>
      </Link>
    </motion.div>
  );
}

// 列表条目组件 (列表视图)
function ArchiveListItem({ item, index, theme, currentTheme }: { item: Lesson, index: number, theme: typeof THEMES.white, currentTheme: keyof typeof THEMES }) {
  const coverImage = item.coverImg16x9 || item.coverImg;
  
  // 🔐 获取会员状态
  const { tier } = useMembership();
  
  // 判断是否需要显示锁图标
  const needsLock = (item.category === 'cognitive' || item.category === 'business') && 
                    !item.isSample && 
                    (tier === 'quarterly' || tier === null);
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.4, delay: index * 0.03 }}
      className="group cursor-pointer"
    >
      <Link href={`/course/${item.category}/${item.id}`} className="flex gap-6 items-start hover:opacity-80 transition-opacity">
        
        {/* 左侧：封面图片 */}
        <div className="relative aspect-video w-64 flex-shrink-0 overflow-hidden transition-colors duration-500" style={{ backgroundColor: theme.secondary }}>
          {coverImage ? (
          <img 
              src={coverImage} 
              alt={item.titleEn} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          ) : (
            <div className="w-full h-full flex items-center justify-center opacity-20">
              <span className="text-sm">No Image</span>
            </div>
          )}
          
          {/* 🔒 锁图标覆盖层 - 仅当需要时显示 */}
          {needsLock && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Lock size={20} className="text-white" />
              </div>
            </div>
          )}
        </div>

        {/* 右侧：文字内容 */}
        <div className="flex-1 py-2">
          {/* 英文标题 */}
          <h3 className="font-serif text-xl md:text-2xl uppercase tracking-wide mb-3 transition-colors duration-500" style={{ color: theme.text }}>
            {item.titleEn}
          </h3>

          {/* 中文标题 */}
          <p className="font-sans text-sm md:text-base leading-relaxed opacity-70 transition-colors duration-500" style={{ fontFamily: "'PingFang SC', sans-serif", color: theme.text }}>
            {item.titleCn}
          </p>

          {/* EP 和日期 */}
          <div className="flex gap-4 mt-3 text-sm opacity-50">
            <span>EP {item.ep}</span>
            <span>{item.date}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function ArchivesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F5F1E8]" />}>
      <ArchiveContent />
    </Suspense>
  );
}
