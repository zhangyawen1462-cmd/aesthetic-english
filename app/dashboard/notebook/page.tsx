"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Search, Bookmark, PlayCircle, Trash2 } from "lucide-react";
import type { CollectedItem } from "@/data/types";
import { getNotebook, removeFromNotebook } from "@/lib/notebook-store";
import { useSubscriptionGuard } from "@/lib/hooks/useSubscriptionGuard";
import SubscriptionModal from "@/components/SubscriptionModal";

// 主题配置 - 与 archives 页面保持一致
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

export default function MyNotebook() {
  const [filter, setFilter] = useState("all");
  const [items, setItems] = useState<CollectedItem[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTheme, setCurrentTheme] = useState<keyof typeof THEMES>('white');
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CollectedItem | null>(null);

  const theme = THEMES[currentTheme];

  // 🔐 游客拦截系统
  const { isGuest, shouldShowSubscription, closeSubscriptionModal } = useSubscriptionGuard();

  // 🔐 游客拦截：如果是游客，直接显示拦截弹窗
  useEffect(() => {
    if (isGuest) {
      // 不加载任何数据，直接显示订阅弹窗
      return;
    }
    // 只有会员才能读取笔记数据
    setItems(getNotebook());
  }, [isGuest]);

  // 过滤逻辑
  const filteredItems = items.filter(item => {
    const matchesFilter = filter === "all" || item.type === filter;
    const matchesSearch = item.content.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.sub && item.sub.includes(searchQuery));
    return matchesFilter && matchesSearch;
  });

  // 删除收藏
  const handleDelete = (id: string) => {
    removeFromNotebook(id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const CATEGORIES = [
    { id: 'all', label: 'ALL COLLECTIONS' },
    { id: 'vocabulary', label: 'VOCABULARY' },
    { id: 'sentence', label: 'SENTENCES' },
    { id: 'grammar', label: 'GRAMMAR' },
  ];

  // 🔐 如果是游客，显示拦截界面
  if (isGuest) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center" style={{ backgroundColor: theme.bg }}>
        <SubscriptionModal 
          isOpen={true} 
          onClose={() => window.location.href = '/dashboard'} 
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full font-sans transition-colors duration-500" style={{ backgroundColor: theme.bg, color: theme.text }}>

      {/* ─── VOGUE Style Header ─── */}
      <header className="sticky top-0 z-50 w-full transition-colors duration-500" style={{ backgroundColor: theme.bg, borderBottom: `1px solid ${theme.text}1A` }}>

        {/* Row 1: Logo & Utilities */}
        <div className="max-w-[1400px] mx-auto px-6 py-3 md:py-4 relative flex items-center justify-center">

            {/* 左侧：返回 Dashboard */}
            <div className="absolute left-6 hidden md:block">
        <Link
          href="/dashboard"
                    className="text-[10px] uppercase tracking-[0.2em] hover:underline underline-offset-4 transition-colors" 
                    style={{ color: theme.accent }}
        >
                    Back to Lobby
        </Link>
            </div>

            {/* 中间：主 Logo */}
            <h1 
                className="font-serif text-3xl md:text-[50px] font-bold tracking-tighter text-center cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setFilter('all')}
                style={{ fontFamily: "'Didot', 'Bodoni MT', 'Noto Serif SC', serif", color: theme.text }}
            >
                MY NOTEBOOK
            </h1>

            {/* 右侧：工具栏 */}
            <div className="absolute right-6 flex items-center gap-6" style={{ color: theme.text }}>
                <button onClick={() => setIsSearchOpen(!isSearchOpen)} className="hover:opacity-60 transition-opacity">
                    <Search size={20} strokeWidth={1.5} />
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
                            placeholder="SEARCH COLLECTIONS..." 
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
                        onClick={() => setFilter(cat.id)}
                        className="text-[13px] md:text-[15px] uppercase tracking-[0.1em] transition-colors relative group whitespace-nowrap touch-manipulation flex-shrink-0"
                        style={{ 
                          color: filter === cat.id ? theme.text : `${theme.text}66`,
                          fontFamily: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif"
                        }}
                    >
                        {cat.label}
                        {filter === cat.id && (
                            <motion.div 
                                layoutId="underline" 
                                className="absolute -bottom-2 md:-bottom-4 left-0 right-0 h-[2px]" 
                                style={{ backgroundColor: theme.accent }} 
                            />
                        )}
                    </button>
                ))}
            </div>
        </nav>
      </header>

      {/* ─── Main Content ─── */}
      <main className="max-w-[1400px] mx-auto px-6 pt-6 pb-20 min-h-screen">

        {/* 空状态 */}
        {filteredItems.length === 0 && items.length === 0 ? (
          <div className="py-32 text-center opacity-40">
            <p className="font-serif italic text-2xl" style={{ color: theme.text }}>
              Your notebook is empty. Go to the Studio to collect moments.
            </p>
          </div>
        ) : (
          /* 网格视图 - 5列布局 */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item, index) => (
                <NotebookCard 
                  key={item.id} 
                  item={item} 
                  index={index} 
                  theme={theme} 
                  onDelete={handleDelete}
                  onClick={() => setSelectedItem(item)}
                />
              ))}
            </AnimatePresence>
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

      {/* ─── Detail Modal ─── */}
      <AnimatePresence>
        {selectedItem && (
          <DetailModal 
            item={selectedItem} 
            theme={theme} 
            onClose={() => setSelectedItem(null)}
            onDelete={(id) => {
              handleDelete(id);
              setSelectedItem(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* ─── The Fabric Swatch (面料色卡) ─── */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
        
        {/* 色卡按钮 */}
        <button
          onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
          className="relative group"
        >
          <div 
            className="w-10 h-10 rounded-sm shadow-lg transition-all duration-300 group-hover:scale-110"
            style={{ 
              backgroundColor: theme.bg,
              border: `2px solid ${theme.text}`,
              boxShadow: `0 4px 12px ${theme.text}40`
            }}
          >
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
                  
                  <span 
                    className="text-[11px] uppercase tracking-wider font-medium"
                    style={{ 
                      color: currentTheme === t.id ? theme.accent : theme.text,
                      fontFamily: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif"
                    }}
                  >
                    {t.displayName}
                  </span>
              </button>
            ))}
            </motion.div>
          )}
        </AnimatePresence>
          </div>

      {/* 游客拦截弹窗（仅在非游客模式下显示，用于其他交互） */}
      {!isGuest && (
        <SubscriptionModal 
          isOpen={shouldShowSubscription} 
          onClose={closeSubscriptionModal} 
        />
      )}
        </div>
  );
}

// 详情模态框组件
function DetailModal({ item, theme, onClose, onDelete }: { 
  item: CollectedItem, 
  theme: typeof THEMES.white, 
  onClose: () => void,
  onDelete: (id: string) => void 
}) {
  return (
    <>
      {/* 背景遮罩 - 删除模糊效果 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[100]"
        style={{ backgroundColor: `${theme.bg}CC` }}
      />

      {/* 模态框内容 - 背景色和文字色对调 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-0 z-[101] flex items-center justify-center p-6"
        onClick={onClose}
      >
        <div 
          className="relative w-full max-w-2xl max-h-[80vh] overflow-y-auto p-8 md:p-12 rounded-sm"
          style={{ 
            backgroundColor: theme.text,
            color: theme.bg,
            border: `1px solid ${theme.bg}1A`,
            boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.25)`
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 关闭按钮 */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center hover:opacity-60 transition-opacity"
            style={{ color: theme.bg }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>

          {/* 类型标签 */}
          <div className="flex items-center gap-2 mb-6 opacity-60">
            <Bookmark size={12} />
            <span className="text-[10px] uppercase tracking-[0.15em]" style={{ fontFamily: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif" }}>
              {item.type}
            </span>
          </div>

          {/* 主内容 */}
          <h2 className="text-3xl md:text-4xl mb-4 leading-tight"
              style={{ 
                fontFamily: /[\u4e00-\u9fa5]/.test(item.content) 
                  ? "'PingFang SC', sans-serif" 
                  : "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
                fontWeight: 600,
                letterSpacing: /[\u4e00-\u9fa5]/.test(item.content) ? '0.02em' : '0.05em'
              }}>
            {item.content}
          </h2>

          {/* 副标题 */}
          {item.sub && (
            <p className="text-base opacity-60 tracking-wide mb-6"
               style={{ fontFamily: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif" }}>
              {item.sub}
            </p>
          )}

          {/* 笔记 */}
          {item.note && (
            <div className="relative pl-4 border-l-2 py-2 mb-8" style={{ borderColor: `${theme.bg}30` }}>
              <p className="text-base leading-relaxed opacity-80"
                 style={{ 
                   fontFamily: /[\u4e00-\u9fa5]/.test(item.note) 
                     ? "'PingFang SC', sans-serif" 
                     : "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif"
                 }}>
                {item.note}
              </p>
            </div>
          )}

          {/* 来源链接 */}
          <div className="pt-6 border-t" style={{ borderColor: `${theme.bg}20` }}>
            <Link
              href={`/course/${item.category || 'daily'}/${item.lessonId}`}
              className="inline-flex items-center gap-2 text-sm uppercase tracking-wider hover:opacity-60 transition-opacity"
              style={{ color: theme.bg, fontFamily: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif" }}
            >
              <span>From: {item.lessonId}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </Link>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3 mt-8">
            <button
              onClick={() => onDelete(item.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-sm hover:bg-red-500 hover:text-white transition-all"
              style={{ backgroundColor: `${theme.bg}10`, color: theme.bg, fontFamily: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif" }}
            >
              <Trash2 size={16} />
              <span className="text-sm uppercase tracking-wider">Delete</span>
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// 网格卡片组件
function NotebookCard({ item, index, theme, onDelete, onClick }: { 
  item: CollectedItem, 
  index: number, 
  theme: typeof THEMES.wine, 
  onDelete: (id: string) => void,
  onClick: () => void
}) {
  // 根据类型获取强调色和背景色
  const getTypeStyle = () => {
    switch (item.type) {
      case 'vocabulary':
        return {
          borderColor: theme.accent,
          bgOverlay: `${theme.accent}08`,
        };
      case 'sentence':
        return {
          borderColor: `${theme.text}90`,
          bgOverlay: `${theme.text}05`,
        };
      case 'grammar':
        return {
          borderColor: `${theme.text}70`,
          bgOverlay: `${theme.text}03`,
        };
      default:
        return {
          borderColor: theme.accent,
          bgOverlay: `${theme.accent}08`,
        };
    }
  };

  const typeStyle = getTypeStyle();

  return (
              <motion.div
                layout
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, scale: 0.95 }} 
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="group cursor-pointer"
    >
      <div className="block h-full" onClick={onClick}>
        
        {/* 卡片主体 - 正方形 */}
        <div className="relative aspect-square w-full overflow-hidden p-5 flex flex-col justify-between transition-all duration-500 hover:shadow-2xl" 
             style={{ 
               backgroundColor: theme.secondary, 
               border: `1px solid ${theme.text}1A`,
               borderTop: `4px solid ${typeStyle.borderColor}`,
               boxShadow: `inset 0 0 0 1000px ${typeStyle.bgOverlay}`
             }}>
          
          {/* 顶部：类型标签 */}
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2 opacity-60">
              <Bookmark size={10} />
              <span className="text-[8px] uppercase tracking-[0.15em]" style={{ fontFamily: 'sans-serif' }}>
                {item.type}
              </span>
                  </div>
                  <button
              onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                    className="hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    title="Remove from notebook"
                  >
              <Trash2 size={12} />
                  </button>
                </div>

          {/* 中间：内容 */}
          <div className="flex-1 flex flex-col justify-center">
            <h3 className="text-[16px] leading-tight mb-1.5" 
                style={{ 
                  fontFamily: /[\u4e00-\u9fa5]/.test(item.content) 
                    ? "'PingFang SC', sans-serif" 
                    : "sans-serif",
                  fontWeight: 600,
                  letterSpacing: /[\u4e00-\u9fa5]/.test(item.content) ? '0.02em' : '0.05em'
                }}>
                    {item.content}
                  </h3>

                  {item.sub && (
              <p className="text-[11px] opacity-60 font-mono tracking-wide mb-3">
                      {item.sub}
                    </p>
                  )}

                  {item.note && (
              <div className="relative pl-2.5 border-l py-0.5" style={{ borderColor: `${theme.text}20` }}>
                <p className="text-[11px] opacity-80 leading-relaxed line-clamp-2"
                   style={{ 
                     fontFamily: /[\u4e00-\u9fa5]/.test(item.note) 
                       ? "'PingFang SC', sans-serif" 
                       : "sans-serif"
                   }}>
                        {item.note}
                      </p>
                    </div>
                  )}
                </div>

          {/* 底部：播放按钮 */}
          <div className="flex items-center justify-end">
                {item.timestamp !== undefined && (
              <PlayCircle size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
                  </div>
        </div>
    </div>
    </motion.div>
  );
}
