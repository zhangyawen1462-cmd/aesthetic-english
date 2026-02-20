"use client";

import React, { useState, useRef, useMemo, useCallback, useEffect, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Pause, ChevronLeft, Maximize, Minimize,
  FileText, Headphones, Mic, BookOpen, Lightbulb, RotateCcw, MessageCircle, Settings, Download
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

// --- 数据层 ---
import type { Lesson } from "@/data/types";
import { parseSRT } from "@/lib/parse-srt";

// --- 权限控制 ---
import { useMembership } from "@/context/MembershipContext";
import { checkVideoAccess } from "@/lib/permissions";
import type { VideoSection } from "@/lib/permissions";
import ContentGate from "@/components/ContentGate";

// --- 统一配置 ---
import { THEMES, type CategoryKey, type ThemeConfig } from "@/lib/theme-config";
import { ANIMATION_CONFIG } from "@/lib/animation-config";

// --- 自定义 Hooks ---
import { useResponsive } from "@/lib/hooks/useResponsive";
import { useVideoControl } from "@/lib/hooks/useVideoControl";
import { useResizablePanel } from "@/lib/hooks/useResizablePanel";
import { useKeyboardShortcuts } from "@/lib/hooks/useKeyboardShortcuts";

// --- 子模块（懒加载优化） ---
const ModuleScript = lazy(() => import("@/components/ModuleScript"));
const ModuleBlind = lazy(() => import("@/components/ModuleBlind"));
const ModuleShadow = lazy(() => import("@/components/ModuleShadow"));
const ModuleVocab = lazy(() => import("@/components/ModuleVocab"));
const ModuleGrammar = lazy(() => import("@/components/ModuleGrammar"));
const ModuleRecall = lazy(() => import("@/components/ModuleRecall"));
const ModuleSalon = lazy(() => import("@/components/ModuleSalon"));
const ExportPDFButton = lazy(() => import("@/components/ExportPDFButton"));
const ExportAudioButton = lazy(() => import("@/components/ExportAudioButton"));

const TABS = [
  { id: 'script', label: 'SCRIPT', num: 'I', icon: FileText },
  { id: 'blind', label: 'BLIND', num: 'II', icon: Headphones },
  { id: 'shadow', label: 'SHADOW', num: 'III', icon: Mic },
  { id: 'vocab', label: 'VOCAB', num: 'IV', icon: BookOpen },
  { id: 'grammar', label: 'GRAMMAR', num: 'V', icon: Lightbulb },
  { id: 'recall', label: 'RECALL', num: 'VI', icon: RotateCcw },
  { id: 'salon', label: 'SALON', num: 'VII', icon: MessageCircle },
];

/** 格式化时间 mm:ss */
function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** 纯净明信片背景 - 无纹理无渐变 */
function PremiumCardSurface({ theme }: { theme: ThemeConfig }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0"
      style={{ backgroundColor: theme.bg }}
    />
  );
}

/** 模块加载占位符 */
function ModuleLoader() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin opacity-20" />
        <p className="text-[10px] uppercase tracking-[0.2em] opacity-30">LOADING</p>
      </div>
    </div>
  );
}

export default function CoursePage() {
  const params = useParams<{ category: string; courseId: string }>();
  const category = (params?.category || 'daily') as CategoryKey;
  const courseId = params?.courseId || '';

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isLoadingLesson, setIsLoadingLesson] = useState(true);

  // 从 API 获取课程数据
  useEffect(() => {
    async function fetchLesson() {
      try {
        setIsLoadingLesson(true);
        const response = await fetch(`/api/lessons/${courseId}`);
        const data = await response.json();
        if (data.success) {
          const lessonData = data.data;
          
          // 调试日志：检查视频 URL
          console.log('📹 Lesson Data:', {
            id: lessonData.id,
            videoUrl: lessonData.videoUrl,
            coverImg: lessonData.coverImg,
            hasVideo: !!lessonData.videoUrl,
          });
          
          setLesson(lessonData);
        }
      } catch (error) {
        console.error('Failed to fetch lesson:', error);
      } finally {
        setIsLoadingLesson(false);
      }
    }
    fetchLesson();
  }, [courseId]);

  const transcript = useMemo(
    () => (lesson ? parseSRT(lesson.srtRaw) : []),
    [lesson]
  );

  // 🔐 权限检查
  const { tier } = useMembership();
  const hasVideoAccess = lesson ? checkVideoAccess(tier, category as VideoSection, lesson.isSample || false) : false;

  // --- 状态 ---
  const [activeTab, setActiveTab] = useState('script');
  const [currentTheme, setCurrentTheme] = useState<CategoryKey>(category);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [mobileVideoHeight, setMobileVideoHeight] = useState(40); // 移动端视频高度百分比 (dvh)
  const [isDraggingMobile, setIsDraggingMobile] = useState(false);
  const [showProgressBar, setShowProgressBar] = useState(false); // 控制进度条显示
  const progressBarTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- Hooks ---
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const isMobile = useResponsive();
  const { containerRef, leftWidth, isDragging, setIsDragging } = useResizablePanel(50, 30, 70);
  const {
    isPlaying, currentTime, duration, playbackRate,
    setIsPlaying, setPlaybackRate, togglePlay, handleSeek,
    handleTimeUpdate, handleLoadedMetadata,
  } = useVideoControl(videoRef);

  const theme: ThemeConfig = THEMES[currentTheme];

  // --- 控制进度条显示逻辑 ---
  useEffect(() => {
    // 暂停时显示进度条
    if (!isPlaying) {
      setShowProgressBar(true);
      // 清除之前的定时器
      if (progressBarTimeoutRef.current) {
        clearTimeout(progressBarTimeoutRef.current);
      }
    } else {
      // 播放时，3秒后隐藏进度条
      if (progressBarTimeoutRef.current) {
        clearTimeout(progressBarTimeoutRef.current);
      }
      progressBarTimeoutRef.current = setTimeout(() => {
        setShowProgressBar(false);
      }, 3000);
    }

    return () => {
      if (progressBarTimeoutRef.current) {
        clearTimeout(progressBarTimeoutRef.current);
      }
    };
  }, [isPlaying]);

  // 鼠标移动或触摸时显示进度条
  const handleVideoInteraction = useCallback(() => {
    setShowProgressBar(true);
    if (progressBarTimeoutRef.current) {
      clearTimeout(progressBarTimeoutRef.current);
    }
    if (isPlaying) {
      progressBarTimeoutRef.current = setTimeout(() => {
        setShowProgressBar(false);
      }, 3000);
    }
  }, [isPlaying]);

  // --- 监听屏幕方向变化 ---
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

  // --- 全屏功能（仅移动端） ---
  const toggleFullscreen = useCallback(() => {
    if (!videoContainerRef.current || !isMobile) return;

    if (!isFullscreen) {
      // 进入全屏
      if (videoContainerRef.current.requestFullscreen) {
        videoContainerRef.current.requestFullscreen();
      } else if ((videoContainerRef.current as any).webkitRequestFullscreen) {
        (videoContainerRef.current as any).webkitRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      // 退出全屏
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
      setIsFullscreen(false);
    }
  }, [isFullscreen, isMobile]);

  // 监听全屏状态变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // --- 优化：缓存视频容器样式（支持横竖屏自适应） ---
  const videoContainerStyle = useMemo(() => {
    if (!isMobile) {
      return {
        height: '100%',
        width: `${leftWidth}%`,
      };
    }

    // 移动端：根据屏幕方向调整
    if (isLandscape) {
      // 横屏：占据更多高度
      return {
        height: 'auto',
        minHeight: '50dvh',
        maxHeight: '70dvh',
        aspectRatio: '16 / 9',
        width: '100%',
      };
    } else {
      // 竖屏：使用动态高度
      return {
        height: `${mobileVideoHeight}dvh`,
        width: '100%',
      };
    }
  }, [isMobile, leftWidth, isLandscape, mobileVideoHeight]);

  // --- 键盘快捷键 ---
  useKeyboardShortcuts({
    onPlayPause: togglePlay,
    onSeekForward: useCallback(() => handleSeek(currentTime + 5), [handleSeek, currentTime]),
    onSeekBackward: useCallback(() => handleSeek(Math.max(0, currentTime - 5)), [handleSeek, currentTime]),
    onSpeedUp: useCallback(() => setPlaybackRate(Math.min(playbackRate + 0.25, 2)), [setPlaybackRate, playbackRate]),
    onSpeedDown: useCallback(() => setPlaybackRate(Math.max(playbackRate - 0.25, 0.5)), [setPlaybackRate, playbackRate]),
    onTabSwitch: useCallback((index: number) => {
      if (index >= 0 && index < TABS.length) {
        setActiveTab(TABS[index].id);
      }
    }, []),
  });

  // --- 键盘上下键切换模块 ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果用户正在输入框中，不触发
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const currentIndex = TABS.findIndex(tab => tab.id === activeTab);
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        // 切换到下一个模块
        const nextIndex = (currentIndex + 1) % TABS.length;
        setActiveTab(TABS[nextIndex].id);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        // 切换到上一个模块
        const prevIndex = (currentIndex - 1 + TABS.length) % TABS.length;
        setActiveTab(TABS[prevIndex].id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab]);

  // --- 移动端视频区域拖拽 ---
  const handleMobileDragStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!isMobile) return;
    setIsDraggingMobile(true);
  }, [isMobile]);

  const handleMobileDragMove = useCallback((clientY: number) => {
    if (!isDraggingMobile || !isMobile) return;
    
    const windowHeight = window.innerHeight;
    const newHeight = (clientY / windowHeight) * 100;
    
    // 限制在 20dvh 到 60dvh 之间
    const clampedHeight = Math.max(20, Math.min(60, newHeight));
    setMobileVideoHeight(clampedHeight);
  }, [isDraggingMobile, isMobile]);

  const handleMobileDragEnd = useCallback(() => {
    setIsDraggingMobile(false);
  }, []);

  useEffect(() => {
    if (!isMobile) return;

    const handleTouchMove = (e: TouchEvent) => {
      if (isDraggingMobile) {
        e.preventDefault();
        handleMobileDragMove(e.touches[0].clientY);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingMobile) {
        handleMobileDragMove(e.clientY);
      }
    };

    const handleEnd = () => {
      handleMobileDragEnd();
    };

    if (isDraggingMobile) {
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('touchend', handleEnd);
      document.addEventListener('mouseup', handleEnd);
    }

    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchend', handleEnd);
      document.removeEventListener('mouseup', handleEnd);
    };
  }, [isDraggingMobile, isMobile, handleMobileDragMove, handleMobileDragEnd]);

  // --- 加载中 ---
  if (isLoadingLesson) {
    return (
      <div className="h-[100dvh] w-full flex flex-col items-center justify-center bg-ecru">
        <div className="w-8 h-8 border-2 border-plum-wine border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs uppercase tracking-[0.2em] text-plum-wine/60">LOADING</p>
      </div>
    );
  }

  // --- 课程未找到 ---
  if (!lesson) {
    return (
      <div className="h-[100dvh] w-full flex flex-col items-center justify-center bg-ecru">
        <p className="font-sans text-2xl md:text-3xl text-plum-wine mb-4">Lesson Not Found</p>
        <p className="text-xs md:text-sm text-plum-wine/60 mb-8 px-6 text-center">The course you&apos;re looking for doesn&apos;t exist yet.</p>
        <Link href="/dashboard" className="text-[10px] uppercase tracking-[0.2em] text-plum-wine border border-plum-wine/30 px-6 py-3 hover:bg-plum-wine hover:text-ecru transition-all">
          Return to Gallery
        </Link>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-[100dvh] w-full flex flex-col md:flex-row overflow-hidden transition-colors duration-700 select-none safe-x"
      style={{ backgroundColor: theme.bg, color: theme.text }}
    >

      {/* ═══════════════════════════════════════
          1. 视频区域
          - 移动端: 自适应 16:9 + 横竖屏自适应 + 支持全屏
          - 桌面端: 可拖拽宽度
          - 🔐 权限保护: 使用 ContentGate 包裹
         ═══════════════════════════════════════ */}
      <ContentGate 
        section={category as VideoSection} 
        isSample={lesson.isSample || false}
        className="shrink-0 z-10 shadow-2xl transition-all overflow-hidden w-full md:h-full md:basis-auto safe-top"
      >
      <div
        ref={videoContainerRef}
        className="relative bg-black flex items-center justify-center w-full h-full"
        style={videoContainerStyle}
        onMouseMove={handleVideoInteraction}
        onTouchStart={handleVideoInteraction}
      >
        {/* 返回按钮 — 移动端加大触控区 */}
        <Link
          href={`/course/${category}`}
          className="absolute top-3 left-3 md:top-4 md:left-4 z-50 text-white/40 hover:text-white active:text-white transition-colors p-2 touch-manipulation"
          aria-label="返回课程列表"
        >
          <ChevronLeft size={isMobile ? 24 : 22} />
        </Link>

        {/* Aesthetic English 水印 */}
        <div className="absolute top-3 right-3 md:top-4 md:right-4 z-50 pointer-events-none">
          <p className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] text-white/20 font-serif">
            Aesthetic English
          </p>
        </div>

        {lesson.videoUrl && lesson.videoUrl.trim() !== '' ? (
          <video
            ref={videoRef}
            src={lesson.videoUrl}
            className="w-full h-full object-contain"
            onClick={togglePlay}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onError={(e) => {
              if (process.env.NODE_ENV === 'development') {
                console.error('❌ Video load error:', {
                  src: lesson.videoUrl,
                  error: e,
                });
              }
            }}
            playsInline
            aria-label={`${lesson.titleEn} 视频播放器`}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-white/30 px-6">
            <Play size={32} className="mb-3 opacity-30" />
            <p className="text-[10px] uppercase tracking-[0.15em] mb-2">Video Coming Soon</p>
            <p className="text-[8px] text-white/20 text-center max-w-xs">
              This lesson doesn&apos;t have a video yet. Please check back later.
            </p>
          </div>
        )}

        {/* 播放区域底部微渐变，让进度条区域自然过渡 */}
        <div
          className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none z-20"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)' }}
        />

        {!isPlaying && lesson.videoUrl && lesson.videoUrl.trim() !== '' && (
          <div onClick={togglePlay} className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 cursor-pointer z-[25] touch-manipulation">
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-lg active:scale-95 transition-transform">
              <Play size={isMobile ? 28 : 32} className="text-white ml-0.5" fill="currentColor" />
            </div>
            {/* 中文标题 */}
            {lesson.titleCn && (
              <p className="mt-4 text-white/90 text-sm sm:text-base font-sans max-w-[85%] text-center px-4 font-medium">
                {lesson.titleCn}
              </p>
            )}
            {/* 英文标题 */}
            {lesson.titleEn && (
              <p className="mt-2 text-white/70 text-xs sm:text-sm font-sans max-w-[85%] text-center px-4">
                {lesson.titleEn}
              </p>
            )}
            {lesson.ep != null && <p className="mt-2 text-[9px] sm:text-[10px] uppercase tracking-widest text-white/40">EP.{lesson.ep}</p>}
          </div>
        )}

        {/* 视频进度条：流畅的液态动画 - 根据状态显示/隐藏 */}
        {lesson.videoUrl && lesson.videoUrl.trim() !== '' && (
          <motion.div 
            className="absolute bottom-0 left-0 right-0 z-30 group/progress"
            initial={{ opacity: 0, y: 10 }}
            animate={{ 
              opacity: showProgressBar ? 1 : 0,
              y: showProgressBar ? 0 : 10
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div
              className="h-[3px] sm:h-[2px] group-hover/progress:h-1.5 cursor-pointer transition-all duration-200 flex items-center touch-manipulation relative"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%)' }}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                if (duration > 0) {
                  handleSeek(percent * duration);
                }
              }}
              onTouchStart={(e) => {
                const touch = e.touches[0];
                const rect = e.currentTarget.getBoundingClientRect();
                const percent = (touch.clientX - rect.left) / rect.width;
                if (duration > 0) {
                  handleSeek(percent * duration);
                }
              }}
              role="slider"
              aria-label="视频进度条"
              aria-valuemin={0}
              aria-valuemax={duration}
              aria-valuenow={currentTime}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'ArrowLeft') handleSeek(Math.max(0, currentTime - 5));
                if (e.key === 'ArrowRight') handleSeek(Math.min(duration, currentTime + 5));
              }}
            >
              <div className="absolute inset-0 bg-white/10" />
              <motion.div
                layout
                className="h-full relative rounded-full min-w-0"
                initial={false}
                animate={{
                  width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%',
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                  mass: 0.8,
                }}
                style={{
                  backgroundColor: theme.accent,
                }}
              >
                {/* 圆形拖拽手柄 — 移动端始终显示，桌面端 hover 显示 */}
                <motion.div
                  layout
                  className={`absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-white shadow-md border border-white/30 transition-opacity ${isMobile ? 'opacity-100' : 'opacity-0 group-hover/progress:opacity-100'}`}
                  style={{ transform: 'translate(50%, -50%)' }}
                />
              </motion.div>
            </div>
            {/* 时间显示：移动端始终显示，桌面端 hover 渐入 */}
            <div className={`flex justify-between px-3 sm:px-4 py-1.5 text-[8px] sm:text-[9px] text-white/40 transition-opacity ${isMobile ? 'opacity-100' : 'opacity-0 group-hover/progress:opacity-100'}`}>
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </motion.div>
        )}
      </div>
      </ContentGate>

      {/* ═══════════════════════════════════════
          1.5 移动端拖拽分隔线
         ═══════════════════════════════════════ */}
      {isMobile && !isLandscape && (
        <div
          onTouchStart={handleMobileDragStart}
          onMouseDown={handleMobileDragStart}
          className="md:hidden relative z-50 flex items-center justify-center cursor-row-resize touch-manipulation"
          style={{ 
            height: '12px',
            backgroundColor: theme.bg,
            borderTop: `1px solid ${theme.lineColor}20`,
            borderBottom: `1px solid ${theme.lineColor}20`,
          }}
        >
          {/* 拖拽手柄 */}
          <div 
            className="w-12 h-1 rounded-full transition-colors"
            style={{ 
              backgroundColor: isDraggingMobile ? theme.accent : `${theme.text}20`,
            }}
          />
        </div>
      )}

      {/* ═══════════════════════════════════════
          2. 中轴线（仅桌面）— 8px 渐变暗影分隔带 + 中间 1px accent
         ═══════════════════════════════════════ */}
      <div
        onMouseDown={() => setIsDragging(true)}
        className="hidden md:flex relative z-50 items-center justify-center cursor-col-resize group shrink-0"
        style={{ width: '8px' }}
      >
        <div className="absolute inset-y-0 -left-3 -right-3 bg-transparent z-50" />
        <div
          className="absolute inset-y-0 left-0 w-2 flex items-center justify-center"
          style={{
            background: `linear-gradient(to right, ${theme.lineColor}22 0%, ${theme.lineColor} 20%, ${theme.lineColor} 80%, ${theme.lineColor}22 100%)`,
            boxShadow: `inset 2px 0 4px ${theme.lineColor}40, inset -2px 0 4px ${theme.lineColor}40`,
          }}
        />
        <div
          className="absolute left-[3.5px] w-px h-full transition-colors duration-300"
          style={{ backgroundColor: isDragging ? theme.accent : theme.lineColor }}
        />
      </div>

      {/* ═══════════════════════════════════════
          3. 工作台 — 纯净明信片质感
         ═══════════════════════════════════════ */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative z-10" style={{ backgroundColor: theme.bg }}>

        {/* ─── 移动端图标导航 ─── */}
        <nav
          className="flex md:hidden items-center justify-center shrink-0 safe-bottom relative touch-manipulation py-2 px-2 gap-[18px]"
          style={{
            borderTop: `1px solid ${theme.lineColor}`,
            background: theme.bg + 'F0',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            boxShadow: `0 -3px 12px ${theme.lineColor}12, 0 -1px 0 0 ${theme.lineColor}25`,
          }}
        >
          {TABS.map((tab, index) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="relative flex items-center justify-center touch-manipulation p-2 rounded-lg transition-all flex-shrink-0"
                style={{
                  backgroundColor: isActive ? `${theme.accent}15` : 'transparent',
                }}
                aria-label={`切换到 ${tab.label} 模块`}
                aria-current={isActive ? 'page' : undefined}
              >
                <motion.div
                  animate={{
                    opacity: isActive ? 1 : 0.4,
                    scale: isActive ? 1.1 : 1,
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  style={{ 
                    color: isActive ? theme.accent : theme.text,
                  }}
                >
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                </motion.div>
              </button>
            );
          })}

          {/* 导出按钮 - 移动端 */}
          {lesson && ['script', 'vocab', 'grammar'].includes(activeTab) && (
            <Suspense fallback={null}>
              <ExportPDFButton
                content={
                  activeTab === 'script' 
                    ? transcript.map(line => `${line.en}\n${line.cn}\n`).join('\n')
                    : activeTab === 'vocab'
                    ? lesson.vocab.map(v => `${v.word}\n${v.defCn || v.def}\n例句: ${v.ex}\n`).join('\n')
                    : lesson.grammar.map(note => `${note.point}\n${note.desc}\n例句: ${note.ex}\n`).join('\n')
                }
                filename={`${activeTab}-${lesson.id}`}
                lessonId={lesson.id}
                type={activeTab as 'script' | 'vocab' | 'grammar'}
                className="relative flex items-center justify-center touch-manipulation p-2 rounded-lg transition-all flex-shrink-0"
                style={{ color: theme.text, opacity: 0.4 }}
                iconSize={16}
                isMobile={true}
                theme={theme}
              />
            </Suspense>
          )}

          {/* 🆕 音频导出按钮 - 移动端（仅盲听模块显示） */}
          {lesson && activeTab === 'blind' && lesson.videoUrl && lesson.videoUrl.trim() !== '' && (
            <Suspense fallback={null}>
              <ExportAudioButton
                videoUrl={lesson.videoUrl}
                audioUrl={lesson.audioUrl}
                filename={`${lesson.titleEn || lesson.titleCn}-audio`}
                lessonId={lesson.id}
                className="relative flex items-center justify-center touch-manipulation p-2 rounded-lg transition-all flex-shrink-0"
                style={{ color: theme.text, opacity: 0.4 }}
                iconSize={16}
                isMobile={true}
                theme={theme}
              />
            </Suspense>
          )}

          {/* 设置图标 - 主题切换 */}
          <button
            onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
            className="relative flex items-center justify-center touch-manipulation p-2 rounded-lg transition-all flex-shrink-0 ml-1"
            aria-label="主题设置"
          >
            <Settings 
              size={16} 
              strokeWidth={1.5}
              style={{ 
                color: theme.text,
                opacity: 0.25,
              }}
            />
          </button>
        </nav>

        <div className="flex-1 h-full relative overflow-hidden flex flex-col">

          {/* 课程标题（桌面端） - 已隐藏 */}
          {/* <div className="absolute top-3 right-4 md:top-6 md:right-8 z-30">
            <span className="hidden md:inline text-[10px] uppercase tracking-[0.15em] opacity-30 font-medium">
              {lesson.titleEn}
            </span>
          </div> */}

          {/* ─── 模块内容区（纯净背景 + 移动端优化间距） ─── */}
          <div
            className="flex-1 overflow-y-auto p-4 pt-[0.2rem] sm:pt-6 md:p-8 md:pt-6 pb-[0.2rem] md:pb-[0.2rem] no-scrollbar relative"
            style={{ backgroundColor: theme.bg }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={ANIMATION_CONFIG.pageTransition.initial}
                animate={ANIMATION_CONFIG.pageTransition.animate}
                exit={ANIMATION_CONFIG.pageTransition.exit}
                transition={{ duration: ANIMATION_CONFIG.duration.fast }}
                className="h-full relative z-10"
              >
                <Suspense fallback={<ModuleLoader />}>
                  {activeTab === 'script' && (
                    <ModuleScript currentTime={currentTime} isPlaying={isPlaying} theme={theme} setIsPlaying={setIsPlaying} onSeek={handleSeek} transcript={transcript} lessonId={lesson.id} category={lesson.category} />
                  )}
                  {activeTab === 'blind' && (
                    <ModuleBlind 
                      isPlaying={isPlaying} 
                      theme={theme} 
                      playbackRate={playbackRate} 
                      setPlaybackRate={setPlaybackRate}
                      videoUrl={lesson.videoUrl}
                      lessonId={lesson.id}
                      lessonTitle={lesson.titleEn || lesson.titleCn}
                    />
                  )}
                  {activeTab === 'shadow' && (
                    <ModuleShadow theme={theme} currentTime={currentTime} videoRef={videoRef} transcript={transcript} />
                  )}
                  {activeTab === 'vocab' && (
                    <ModuleVocab theme={theme} vocab={lesson.vocab} lessonId={lesson.id} category={lesson.category} />
                  )}
                  {activeTab === 'grammar' && (
                    <ModuleGrammar theme={theme} onSeek={handleSeek} grammarNotes={lesson.grammar} lessonId={lesson.id} category={lesson.category} />
                  )}
                  {activeTab === 'recall' && (
                    <ModuleRecall theme={theme} recallText={lesson.recall} lessonId={lesson.id} />
                  )}
                  {activeTab === 'salon' && (
                    <ModuleSalon 
                      theme={theme} 
                      data={lesson.salon}
                      videoContext={{
                        titleCn: lesson.titleCn,
                        titleEn: lesson.titleEn,
                        transcript: lesson.srtRaw,
                        vocab: lesson.vocab.map(v => ({ word: v.word, def: v.defCn || v.def || '' }))
                      }}
                      videoMood={lesson.category === 'business' ? '专业、严谨' : lesson.category === 'cognitive' ? '启发、思辨' : '轻松、自然'}
                      lessonId={lesson.id}
                    />
                  )}
                </Suspense>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* ─── 桌面侧边栏：极简竖线 ─── */}
        <div
          className="hidden md:flex w-24 h-full flex-col items-center justify-center gap-3 z-30 transition-colors duration-700 absolute top-0"
          style={{ right: '-2rem' }}
        >
          {TABS.map((tab, index) => {
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                whileHover="hover"
                initial="initial"
                className="relative group flex items-center justify-center pointer-events-auto"
                style={{ width: '64px', height: '40px' }}
                aria-label={`切换到 ${tab.label} 模块`}
                aria-current={isActive ? 'page' : undefined}
              >
                {/* 竖线 */}
                <motion.div
                  animate={{
                    height: isActive ? '40px' : '24px',
                    opacity: isActive ? 1 : 0.3,
                  }}
                  transition={{ type: "spring", ...ANIMATION_CONFIG.spring.medium }}
                  className="w-[1.5px] rounded-full"
                  style={{ 
                    backgroundColor: isActive ? theme.accent : theme.text,
                  }}
                />

                {/* 文字标签 — hover 时渐入，右对齐距离竖线 3rem */}
                <motion.div
                  variants={{
                    initial: { opacity: 0, x: -5 },
                    hover: { opacity: 1, x: 0 },
                  }}
                  transition={{ duration: 0.2 }}
                  className="absolute whitespace-nowrap text-right"
                  style={{ right: '3rem' }}
                >
                  <span 
                    className="text-sm font-bold tracking-wide font-serif"
                    style={{ 
                      color: theme.text,
                    }}
                  >
                    {tab.label}
                  </span>
                </motion.div>

                {/* 快捷键数字 — hover 时渐入 */}
                <span 
                  className="absolute right-2 text-[7px] font-mono opacity-0 group-hover:opacity-20 transition-opacity"
                  style={{ color: theme.text }}
                >
                  {index + 1}
                </span>
              </motion.button>
            );
          })}
          
          {/* 导出按钮 - 桌面端侧边栏 */}
          {lesson && ['script', 'vocab', 'grammar'].includes(activeTab) && (
            <Suspense fallback={null}>
              <ExportPDFButton
                content={
                  activeTab === 'script' 
                    ? transcript.map(line => `${line.en}\n${line.cn}\n`).join('\n')
                    : activeTab === 'vocab'
                    ? lesson.vocab.map(v => `${v.word}\n${v.defCn || v.def}\n例句: ${v.ex}\n`).join('\n')
                    : lesson.grammar.map(note => `${note.point}\n${note.desc}\n例句: ${note.ex}\n`).join('\n')
                }
                filename={`${activeTab}-${lesson.id}`}
                lessonId={lesson.id}
                type={activeTab as 'script' | 'vocab' | 'grammar'}
                iconSize={0}
                isMobile={false}
                theme={theme}
              />
            </Suspense>
          )}
          
          {/* 音频导出按钮 - 桌面端侧边栏（仅盲听模块显示） */}
          {lesson && activeTab === 'blind' && lesson.videoUrl && lesson.videoUrl.trim() !== '' && (
            <Suspense fallback={null}>
              <ExportAudioButton
                videoUrl={lesson.videoUrl}
                filename={`${lesson.titleEn || lesson.titleCn}-audio`}
                lessonId={lesson.id}
                theme={theme}
                iconSize={0}
                isMobile={false}
              />
            </Suspense>
          )}
          
          {/* 底部课程信息锚点 */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none">
            <p 
              className="text-[7px] uppercase tracking-[0.15em] opacity-20 font-medium"
              style={{ 
                color: theme.text,
              }}
            >
              {lesson.ep != null ? `EP.${lesson.ep}` : ''}
            </p>
          </div>
        </div>
      </div>

      {/* ─── The Fabric Swatch (面料色卡) - 仅桌面端显示 ─── */}
      <div className="hidden md:flex fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 items-center gap-3 safe-bottom safe-right">
        
        {/* 色卡按钮 */}
        <button
          onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
          className="relative group touch-manipulation"
          aria-label="打开主题切换菜单"
        >
          {/* 主色块 */}
          <div 
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-sm shadow-lg transition-all duration-300 group-hover:scale-110 active:scale-95"
            style={{ 
              backgroundColor: theme.bg,
              border: `2px solid ${theme.text}`,
              boxShadow: `0 4px 12px ${theme.text}40`
            }}
          >
            {/* 内部强调色小方块 */}
            <div 
              className="absolute bottom-1 right-1 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-[1px]"
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
              className="absolute bottom-0 right-14 sm:right-16 flex flex-col gap-2 p-2.5 sm:p-3 rounded-sm backdrop-blur-md shadow-2xl"
              style={{ 
                backgroundColor: `${theme.sidebar}F5`,
                border: `1px solid ${theme.text}1A`
              }}
            >
              {(Object.keys(THEMES) as CategoryKey[]).map((key) => {
                const t = THEMES[key];
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setCurrentTheme(key);
                      setIsThemeMenuOpen(false);
                    }}
                    className="group/swatch flex items-center gap-2.5 sm:gap-3 px-2.5 sm:px-3 py-2 rounded-[2px] transition-all hover:scale-105 active:scale-95 touch-manipulation"
                    style={{ 
                      backgroundColor: currentTheme === key ? `${theme.text}10` : 'transparent'
                    }}
                    aria-label={`切换到 ${t.label} 主题`}
                  >
                    {/* 色卡样本 */}
                    <div 
                      className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-[2px] transition-transform"
                      style={{ 
                        backgroundColor: t.bg,
                        border: `1.5px solid ${t.text}`,
                        boxShadow: `0 2px 6px ${t.text}30`
                      }}
                    >
                      <div 
                        className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-[1px]"
                        style={{ backgroundColor: t.accent }}
                      />
                    </div>
                    
                    {/* 名称 */}
                    <span 
                      className="text-[10px] sm:text-[11px] uppercase tracking-wider font-medium"
                      style={{ color: currentTheme === key ? theme.accent : theme.text }}
                    >
                      {key === 'daily' ? 'Daily' : key === 'cognitive' ? 'Cognitive' : 'Business'}
                    </span>
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── 移动端主题切换菜单 ─── */}
      <AnimatePresence>
        {isThemeMenuOpen && isMobile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="md:hidden fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex gap-3 p-3 rounded-lg backdrop-blur-md shadow-2xl"
            style={{ 
              backgroundColor: `${theme.bg}F5`,
              border: `1px solid ${theme.text}1A`
            }}
          >
            {(Object.keys(THEMES) as CategoryKey[]).map((key) => {
              const t = THEMES[key];
              return (
                <button
                  key={key}
                  onClick={() => {
                    setCurrentTheme(key);
                    setIsThemeMenuOpen(false);
                  }}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all active:scale-95 touch-manipulation"
                  style={{ 
                    backgroundColor: currentTheme === key ? `${theme.accent}15` : 'transparent'
                  }}
                  aria-label={`切换到 ${t.label} 主题`}
                >
                  {/* 色卡样本 */}
                  <div 
                    className="relative w-10 h-10 rounded-md transition-transform"
                    style={{ 
                      backgroundColor: t.bg,
                      border: `2px solid ${t.text}`,
                      boxShadow: `0 2px 8px ${t.text}30`
                    }}
                  >
                    <div 
                      className="absolute bottom-1 right-1 w-2 h-2 rounded-[1px]"
                      style={{ backgroundColor: t.accent }}
                    />
                  </div>
                  
                  {/* 名称 */}
                  <span 
                    className="text-[9px] uppercase tracking-wider font-medium"
                    style={{ color: currentTheme === key ? theme.accent : theme.text, opacity: 0.7 }}
                  >
                    {key === 'daily' ? 'Daily' : key === 'cognitive' ? 'Cog' : 'Biz'}
                  </span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
