"use client";

import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Lesson } from "@/data/types";

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
  
  const theme = THEMES[currentTheme];

  // 从 API 获取所有课程数据
  useEffect(() => {
    async function fetchLessons() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/lessons');
        const result = await response.json();
        
        if (result.success) {
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

  // 过滤逻辑
  const filteredItems = lessons.filter(item => {
    const matchesFilter = activeFilter === "all" || item.category === activeFilter;
    const matchesSearch = 
      item.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.titleCn.includes(searchQuery) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const CATEGORIES = [
    { id: 'daily', label: 'DAILY AESTHETIC', shortLabel: 'DAILY' },
    { id: 'cognitive', label: 'COGNITIVE GROWTH', shortLabel: 'COGNITIVE' },
    { id: 'business', label: 'BUSINESS FEMALE', shortLabel: 'BUSINESS' },
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
            <div className="max-w-[1400px] mx-auto px-6 flex justify-start md:justify-center items-center gap-6 md:gap-16 min-w-max h-[36px] md:h-auto">
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
      <main className="max-w-[1400px] mx-auto px-4 md:px-6 py-8 md:py-20 min-h-screen">

        {/* 加载状态 */}
        {isLoading && (
          <div className="py-32 text-center">
            <p className="font-serif italic text-xl md:text-2xl opacity-40" style={{ color: theme.text }}>LOADING</p>
          </div>
        )}

        {/* 列表内容 */}
        {!isLoading && viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 md:gap-x-8 gap-y-8 md:gap-y-12">
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item, index) => (
                <ArchiveCard key={item.id} item={item} index={index} theme={theme} currentTheme={currentTheme} />
              ))}
            </AnimatePresence>
        </div>
        )}

        {!isLoading && viewMode === 'list' && (
          <div className="flex flex-col gap-6">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item, index) => (
                <ArchiveListItem key={item.id} item={item} index={index} theme={theme} currentTheme={currentTheme} />
            ))}
          </AnimatePresence>
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
