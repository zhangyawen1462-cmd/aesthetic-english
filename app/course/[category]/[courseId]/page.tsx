"use client";

import React, { useState, useRef, useMemo, useCallback, useEffect, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Pause, ChevronLeft, BookmarkPlus, ChevronRight, Notebook,
  FileText, Headphones, Mic, BookOpen, Lightbulb, RotateCcw, MessageCircle, Settings, Download, Palette, Languages
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

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
import { preconnect, dnsPrefetch } from "@/lib/preload-utils";

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
const SubscriptionModal = lazy(() => import("@/components/SubscriptionModal"));

// --- 导入类型 ---
import type { LangMode } from "@/components/ModuleScript";

const TABS = [
  { id: 'script', label: '字幕精校', num: 'I', icon: FileText, mobileLabel: '看' },
  { id: 'blind', label: '音频盲听', num: 'II', icon: Headphones, mobileLabel: '听' },
  { id: 'shadow', label: '影子跟读', num: 'III', icon: Mic, mobileLabel: '说' },
  { id: 'vocab', label: '单词闪卡', num: 'IV', icon: BookOpen, mobileLabel: '词' },
  { id: 'grammar', label: '语法精讲', num: 'V', icon: Lightbulb, mobileLabel: '语法' },
  { id: 'recall', label: '看中文说英文', num: 'VI', icon: RotateCcw, mobileLabel: '视译' },
  { id: 'salon', label: 'AI情景对话', num: 'VII', icon: MessageCircle, mobileLabel: '交流' },
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
  const router = useRouter();
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
          
          // 调试日志：检查视频 URL 和权限数据
          console.log('📹 Lesson Data:', {
            id: lessonData.id,
            category: lessonData.category,
            isSample: lessonData.isSample,
            videoUrl: lessonData.videoUrl,
            coverImg: lessonData.coverImg,
            hasVideo: !!lessonData.videoUrl,
          });
          
          console.log('🔐 Permission Check:', {
            tier,
            category: category as VideoSection,
            isSample: lessonData.isSample || false,
            hasAccess: checkVideoAccess(tier, category as VideoSection, lessonData.isSample || false)
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

  // 🚪 trial 用户访问非试用课程时，自动弹出订阅弹窗
  useEffect(() => {
    if (lesson && tier === 'trial' && lesson.isSample !== 'freeTrial') {
      setShowSubscriptionModal(true);
    }
  }, [lesson, tier]);

  // --- 状态 ---
  const [activeTab, setActiveTab] = useState('script');
  const [currentTheme, setCurrentTheme] = useState<CategoryKey>(category);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [scriptLangMode, setScriptLangMode] = useState<LangMode>('bi'); // 🆕 Script 模块的语言模式

  const [showProgressBar, setShowProgressBar] = useState(false); // 控制进度条显示
  const progressBarTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false); // 🆕 订阅弹窗
  const [isCollected, setIsCollected] = useState(false); // 🆕 收藏状态

  // 🆕 字幕控制：上一句/下一句
  const handlePrevSubtitle = () => {
    if (transcript.length === 0 || !videoRef.current) return;
    
    const time = videoRef.current.currentTime;
    // 找到当前时间之前的字幕
    const currentIndex = transcript.findIndex(line => line.start > time);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : 0;
    
    if (prevIndex >= 0 && transcript[prevIndex]) {
      handleSeek(transcript[prevIndex].start, true);
    }
  };

  const handleNextSubtitle = () => {
    if (transcript.length === 0 || !videoRef.current) return;
    
    const time = videoRef.current.currentTime;
    // 找到当前时间之后的字幕
    const nextIndex = transcript.findIndex(line => line.start > time);
    
    if (nextIndex >= 0 && nextIndex < transcript.length && transcript[nextIndex]) {
      handleSeek(transcript[nextIndex].start, true);
    }
  };

  // 判断字幕控制按钮是否可用（仅在字幕精校和影子跟读模块）
  const isSubtitleControlEnabled = activeTab === 'script' || activeTab === 'shadow';

  // 预连接到 OSS 域名，加速视频和图片加载
  useEffect(() => {
    preconnect('https://aesthetic-assets.oss-cn-hongkong.aliyuncs.com');
    preconnect('https://assets.aestheticenglish.com');
    dnsPrefetch('https://aesthetic-assets.oss-cn-hongkong.aliyuncs.com');
    dnsPrefetch('https://assets.aestheticenglish.com');
  }, []);

  // 🆕 检查视频是否已收藏
  useEffect(() => {
    if (lesson) {
      const notebook = JSON.parse(localStorage.getItem('notebook') || '[]');
      const collected = notebook.some((item: any) => item.lessonId === lesson.id && item.type === 'video');
      setIsCollected(collected);
    }
  }, [lesson]);

  // 🆕 收藏/取消收藏视频
  const toggleCollectVideo = () => {
    if (!lesson) return;
    
    const notebook = JSON.parse(localStorage.getItem('notebook') || '[]');
    const existingIndex = notebook.findIndex((item: any) => item.lessonId === lesson.id && item.type === 'video');
    
    if (existingIndex >= 0) {
      // 取消收藏
      notebook.splice(existingIndex, 1);
      setIsCollected(false);
    } else {
      // 添加收藏
      notebook.push({
        id: `video-${lesson.id}-${Date.now()}`,
        type: 'video',
        content: lesson.titleCn || lesson.titleEn,
        sub: lesson.titleEn,
        lessonId: lesson.id,
        category: lesson.category,
        videoUrl: lesson.videoUrl,
        coverImg: lesson.coverImg,
        timestamp: Date.now(),
      });
      setIsCollected(true);
    }
    
    localStorage.setItem('notebook', JSON.stringify(notebook));
  };

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

  // 鼠标移动或触摸时显示进度条 - 使用节流优化性能
  const lastInteractionTime = useRef<number>(0);
  const handleVideoInteraction = useCallback(() => {
    const now = Date.now();
    // 节流：200ms 内只触发一次
    if (now - lastInteractionTime.current < 200) {
      return;
    }
    lastInteractionTime.current = now;
    
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

  // --- 优化：缓存视频容器样式（移动端固定大小，桌面端可拖拽） ---
  const videoContainerStyle = useMemo(() => {
    if (!isMobile) {
      return {
        height: '100%',
        width: `${leftWidth}%`,
      };
    }

    // 移动端：固定大小，16:9 比例
    return {
      width: '100%',
      aspectRatio: '16 / 9',
      flexShrink: 0,
    };
  }, [isMobile, leftWidth]);

  // --- 键盘快捷键 ---
  useKeyboardShortcuts({
    onPlayPause: togglePlay,
    onSeekForward: useCallback(() => handleSeek(currentTime + 5, true), [handleSeek, currentTime]),
    onSeekBackward: useCallback(() => handleSeek(Math.max(0, currentTime - 5), true), [handleSeek, currentTime]),
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
          🆕 Top Navigation Bar - 仅移动端显示
         ═══════════════════════════════════════ */}
      {isMobile && (
        <div 
          className="flex md:hidden items-center justify-between px-3 shrink-0 z-50 safe-top"
          style={{
            backgroundColor: theme.bg,
            borderBottom: `1px solid ${theme.lineColor}`,
            height: '40px'
          }}
        >
          {/* 左侧：返回按钮 + 标题 */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center w-10 h-10 transition-colors touch-manipulation shrink-0"
              style={{ color: theme.text }}
              aria-label="返回上一页"
            >
              <ChevronLeft size={24} strokeWidth={2} />
            </button>
            
            {lesson && (
              <h1 
                className="text-[17.5px] font-medium truncate"
                style={{ 
                  fontFamily: "'PingFang SC', -apple-system, BlinkMacSystemFont, sans-serif",
                  color: theme.text
                }}
              >
                {lesson.titleCn}
              </h1>
            )}
          </div>

          {/* 右侧：收藏按钮 */}
          <button
            onClick={toggleCollectVideo}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md transition-all touch-manipulation shrink-0"
            style={{
              backgroundColor: isCollected ? `${theme.accent}15` : 'transparent',
              color: isCollected ? theme.accent : theme.text,
            }}
            aria-label={isCollected ? '取消收藏' : '收藏视频'}
          >
            <Notebook size={16} fill={isCollected ? 'currentColor' : 'none'} strokeWidth={2} />
            <span className="text-[11px] font-medium">收藏本</span>
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════
          1. 视频区域
          - 移动端: 自适应 16:9 + 横竖屏自适应 + 支持全屏
          - 桌面端: 可拖拽宽度
          - 🔐 权限保护: trial 用户访问非试用课程时不显示 ContentGate，直接弹窗
         ═══════════════════════════════════════ */}
      {tier === 'trial' && lesson?.isSample !== 'freeTrial' ? (
        // trial 用户访问非试用课程：显示模糊预览，不用 ContentGate
        <div
          className="shrink-0 z-10 shadow-2xl transition-all overflow-hidden w-full md:h-full md:basis-auto safe-top relative"
          style={{
            ...videoContainerStyle,
            maxHeight: isMobile ? 'auto' : '100%',
          }}
        >
          <div className="absolute inset-0 blur-xl opacity-20 pointer-events-none select-none grayscale bg-black">
            {lesson.coverImg && (
              <img src={lesson.coverImg} alt="" className="w-full h-full object-cover" />
            )}
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <div className="text-center text-white px-6">
              <p className="text-sm mb-4 opacity-70">试用课程专享</p>
              <button
                onClick={() => setShowSubscriptionModal(true)}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/30 text-xs uppercase tracking-widest transition-colors"
              >
                升级会员
              </button>
            </div>
          </div>
        </div>
      ) : (
        // 其他用户：正常使用 ContentGate
        <ContentGate 
          section={category as VideoSection} 
          isSample={lesson?.isSample || false}
        >
      <div
        ref={videoContainerRef}
        className="shrink-0 z-10 shadow-2xl transition-all overflow-hidden w-full md:h-full md:basis-auto safe-top relative bg-black flex items-center justify-center"
        style={videoContainerStyle}
        onMouseMove={handleVideoInteraction}
        onTouchStart={handleVideoInteraction}
      >
        {/* 桌面端：返回按钮和水印 */}
        {!isMobile && (
          <>
            {/* 返回按钮 */}
            <button
              onClick={() => router.back()}
              className="absolute top-3 left-3 md:top-4 md:left-4 z-50 text-white/40 hover:text-white active:text-white transition-colors p-2 touch-manipulation"
              aria-label="返回上一页"
            >
              <ChevronLeft size={22} />
            </button>

            {/* Aesthetic English 水印 */}
            <div className="absolute top-3 right-3 md:top-4 md:right-4 z-50 pointer-events-none">
              <p className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] text-white/20 font-serif">
                Aesthetic English
              </p>
            </div>
          </>
        )}

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
            preload="auto"
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
            {/* 桌面端显示标题 */}
            {!isMobile && (
              <>
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
              </>
            )}
          </div>
        )}

        {/* 视频进度条：仅桌面端显示 */}
        {!isMobile && lesson.videoUrl && lesson.videoUrl.trim() !== '' && (
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
              className="h-[2px] group-hover/progress:h-1.5 cursor-pointer transition-all duration-200 flex items-center relative"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%)' }}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                if (duration > 0) {
                  handleSeek(percent * duration, true);
                }
              }}
              role="slider"
              aria-label="视频进度条"
              aria-valuemin={0}
              aria-valuemax={duration}
              aria-valuenow={currentTime}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'ArrowLeft') handleSeek(Math.max(0, currentTime - 5), true);
                if (e.key === 'ArrowRight') handleSeek(Math.min(duration, currentTime + 5), true);
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
                {/* 圆形拖拽手柄 — 桌面端 hover 显示 */}
                <motion.div
                  layout
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-md border border-white/30 transition-opacity opacity-0 group-hover/progress:opacity-100"
                  style={{ transform: 'translate(50%, -50%)' }}
                />
              </motion.div>
            </div>
            {/* 时间显示：桌面端 hover 渐入 */}
            <div className="flex justify-between px-4 py-1.5 text-[9px] text-white/40 transition-opacity opacity-0 group-hover/progress:opacity-100">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </motion.div>
        )}
      </div>
      </ContentGate>
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

        {/* ─── 移动端：删除横向图标导航栏 ─── */}

        {/* ─── 内容区域容器 ─── */}
        <div className="flex-1 h-full flex flex-row overflow-hidden">
          
          {/* 内容区 */}
        <div className="flex-1 h-full relative overflow-hidden flex flex-col">

            {/* ─── 模块内容区（纯净背景 + 移动端优化间距 + 桌面端左右边距） ─── */}
          <div
              className="flex-1 overflow-y-auto p-4 pt-4 sm:pt-6 md:pl-4 md:pr-[0.8rem] md:pt-6 pb-[5rem] md:pb-[0.2rem] no-scrollbar relative"
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
                    <ModuleScript 
                      currentTime={currentTime} 
                      isPlaying={isPlaying} 
                      theme={theme} 
                      setIsPlaying={setIsPlaying} 
                      onSeek={handleSeek} 
                      transcript={transcript} 
                      lessonId={lesson.id} 
                      category={lesson.category}
                      langMode={scriptLangMode}
                      onLangModeChange={setScriptLangMode}
                    />
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
                      isSample={lesson.isSample}
                    />
                  )}
                </Suspense>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

          {/* ─── 桌面侧边栏：固定在右侧，不浮动 ─── */}
          <div
            className="hidden md:flex w-16 h-full flex-col items-center justify-center gap-8 z-30 transition-colors duration-700 shrink-0 relative"
            style={{ backgroundColor: theme.bg }}
          >
            {/* 左侧极细竖线 - 参考 DailyCinemaView 的质感 + 加强阴影 */}
            <div 
              className="absolute top-0 bottom-0 w-[1px] transition-colors duration-300 pointer-events-none"
              style={{ 
                left: '0.2rem', // 向右移动 0.2rem
                backgroundColor: theme.text, 
                opacity: 0.15,
                boxShadow: '2px 0 6px rgba(0, 0, 0, 0.15), -1px 0 4px rgba(0, 0, 0, 0.08), 1px 0 2px rgba(0, 0, 0, 0.1)'
              }}
            />

            {TABS.map((tab, index) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  whileHover="hover"
                  initial="initial"
                  className="relative group flex items-center justify-center pointer-events-auto"
                  style={{ width: '56px', height: '40px' }}
                  aria-label={`切换到 ${tab.label} 模块`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {/* 图标 - 放大 1.3 * 1.1 = 1.43 倍 */}
                  <motion.div
                    animate={{
                      opacity: isActive ? 1 : 0.45,
                      scale: isActive ? 1.65 : 1.43,
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="relative z-10"
                    style={{ 
                      color: isActive ? theme.accent : theme.text,
                    }}
                  >
                    <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                  </motion.div>

                  {/* 绸缎标签 — hover 时从左侧抽出，深色底浅色字，与图标垂直居中对齐 */}
                  <motion.div
                    variants={{
                      initial: { opacity: 0, x: 15, scaleX: 0.8 },
                      hover: { opacity: 1, x: 0, scaleX: 1 },
                    }}
                    transition={{ 
                      duration: 0.3,
                      ease: [0.34, 1.56, 0.64, 1] // 弹性缓动
                    }}
                    className="absolute whitespace-nowrap rounded-sm shadow-lg px-3 py-1.5 flex items-center pointer-events-none"
                    style={{ 
                      right: 'calc(100% + 12px)',
                      top: 'calc(20px - 2rem + 0.9rem)', // 先上移2rem，再下移0.9rem，净上移1.1rem
                      transform: 'translateY(-50%)',
                      fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif',
                      backgroundColor: theme.text,
                      border: `1px solid ${theme.text}`,
                      transformOrigin: 'right center',
                    }}
                  >
                    <span 
                      className="text-2xl font-medium tracking-wide"
                      style={{ 
                        color: theme.bg,
                      }}
                    >
                      {tab.label}
                    </span>
                    
                    {/* 绸缎连接三角 */}
                    <div 
                      className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full"
                      style={{
                        width: 0,
                        height: 0,
                        borderTop: '5px solid transparent',
                        borderBottom: '5px solid transparent',
                        borderLeft: `5px solid ${theme.text}`,
                      }}
                    />
                  </motion.div>

                  {/* 快捷键数字 — hover 时渐入 */}
                  <span 
                    className="absolute right-1.5 top-1 text-[7px] font-mono opacity-0 group-hover:opacity-20 transition-opacity"
                    style={{ color: theme.text }}
                  >
                    {index + 1}
                  </span>
                </motion.button>
              );
            })}
            
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

            {/* 下载按钮区域 */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-50">
              {/* PDF下载按钮 */}
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
                className="transition-all duration-300 p-2 touch-manipulation hover:opacity-100 pointer-events-auto"
                style={{ color: theme.text, opacity: 0.4 }}
                iconSize={18}
                isMobile={false}
                theme={theme}
                isSample={lesson.isSample}
                onUpgradeClick={() => setShowSubscriptionModal(true)}
              />
            </Suspense>
          )}

              {/* 音频下载按钮（仅盲听模块显示） */}
          {lesson && activeTab === 'blind' && lesson.videoUrl && lesson.videoUrl.trim() !== '' && (
            <Suspense fallback={null}>
              <ExportAudioButton
                videoUrl={lesson.videoUrl}
                audioUrl={lesson.audioUrl}
                filename={`${lesson.titleEn || lesson.titleCn}-audio`}
                lessonId={lesson.id}
                className="transition-all duration-300 p-2 touch-manipulation hover:opacity-100 pointer-events-auto"
                style={{ color: theme.text, opacity: 0.4 }}
                iconSize={18}
                isMobile={false}
                theme={theme}
                isSample={lesson.isSample}
                onUpgradeClick={() => setShowSubscriptionModal(true)}
              />
            </Suspense>
          )}
            </div>
        </div>

        </div>

        {/* ─── 桌面侧边栏：已移到内容区域容器内 ─── */}

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
              className="absolute bottom-0 right-14 sm:right-16 flex flex-col gap-2 p-2"
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
                    className="group/swatch transition-all hover:scale-110 active:scale-95 touch-manipulation"
                    aria-label={`切换到 ${t.label} 主题`}
                  >
                    {/* 色卡样本 */}
                    <div 
                      className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-sm transition-transform"
                      style={{ 
                        backgroundColor: t.bg,
                        border: `2px solid ${t.text}`,
                        boxShadow: `0 4px 12px ${t.text}40`
                      }}
                    >
                      <div 
                        className="absolute bottom-1 right-1 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-[1px]"
                        style={{ backgroundColor: t.accent }}
                      />
                    </div>
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── 移动端底部控制栏（固定在最底部）─── */}
      {isMobile && (
        <div 
          className="fixed bottom-0 left-0 right-0 z-[60] flex items-center justify-between px-6 safe-bottom"
          style={{
            backgroundColor: theme.bg,
            borderTop: `1px solid ${theme.lineColor}`,
            boxShadow: `0 -2px 10px ${theme.lineColor}20`,
            height: '80px'
          }}
        >
          {/* 左侧：设置按钮 */}
          <button
            onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
            className="flex items-center justify-center touch-manipulation transition-all active:scale-95"
            style={{ color: theme.text, opacity: 0.5 }}
            aria-label="更多设置"
          >
            <Settings size={26} strokeWidth={2} />
          </button>

          {/* 中间：播放控制组（垂直居中）*/}
          <div className="flex items-center gap-6">
            {/* 上一句 */}
            <button
              onClick={handlePrevSubtitle}
              disabled={!isSubtitleControlEnabled}
              className="flex items-center justify-center touch-manipulation transition-all active:scale-95"
              style={{
                color: isSubtitleControlEnabled ? theme.text : `${theme.text}30`,
                opacity: isSubtitleControlEnabled ? 0.7 : 0.3
              }}
              aria-label="上一句"
            >
              <ChevronLeft size={24} strokeWidth={2} />
            </button>

            {/* 播放/暂停（视觉焦点）*/}
            <button
              onClick={togglePlay}
              className="flex items-center justify-center rounded-full touch-manipulation transition-all active:scale-95"
              style={{
                width: '56px',
                height: '56px',
                backgroundColor: `${theme.accent}20`,
                color: theme.accent,
                border: `2px solid ${theme.accent}30`,
                boxShadow: `0 1px 3px ${theme.accent}05`
              }}
              aria-label={isPlaying ? '暂停' : '播放'}
            >
              {isPlaying ? (
                <Pause size={26} fill="currentColor" />
              ) : (
                <Play size={26} fill="currentColor" className="ml-0.5" />
              )}
            </button>

            {/* 下一句 */}
            <button
              onClick={handleNextSubtitle}
              disabled={!isSubtitleControlEnabled}
              className="flex items-center justify-center touch-manipulation transition-all active:scale-95"
              style={{
                color: isSubtitleControlEnabled ? theme.text : `${theme.text}30`,
                opacity: isSubtitleControlEnabled ? 0.7 : 0.3
              }}
              aria-label="下一句"
            >
              <ChevronRight size={24} strokeWidth={2} />
            </button>
          </div>

          {/* 右侧：语言切换按钮（仅在 script 模块显示）*/}
          {activeTab === 'script' ? (
            <button
              onClick={() => {
                const modes: LangMode[] = ['bi', 'en', 'cn'];
                const currentIndex = modes.indexOf(scriptLangMode);
                const nextIndex = (currentIndex + 1) % modes.length;
                setScriptLangMode(modes[nextIndex]);
              }}
              className="flex items-center justify-center touch-manipulation transition-all active:scale-95"
              style={{ 
                color: theme.accent,
                opacity: 0.8
              }}
              aria-label="切换语言模式"
            >
              <div className="flex flex-col items-center gap-0.5">
                <Languages size={20} strokeWidth={2} />
                <span className="text-[9px] font-medium uppercase tracking-wider">
                  {scriptLangMode === 'bi' ? 'Dual' : scriptLangMode === 'en' ? 'EN' : 'CN'}
                </span>
              </div>
            </button>
          ) : (
            <div style={{ width: '26px' }} />
          )}
        </div>
      )}

      {/* ─── 移动端主题切换菜单 ─── */}
      <AnimatePresence>
        {isThemeMenuOpen && isMobile && (
          <>
            {/* 背景遮罩 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsThemeMenuOpen(false)}
              className="md:hidden fixed inset-0 z-[60] bg-black/40"
            />
            
            {/* 底部弹出菜单 */}
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="md:hidden fixed bottom-0 left-0 right-0 z-[70] rounded-t-2xl safe-bottom"
              style={{ 
                backgroundColor: theme.bg,
                boxShadow: `0 -4px 20px ${theme.lineColor}30`
              }}
            >
              {/* 拖动条 */}
              <div className="flex justify-center pt-3 pb-2">
                <div 
                  className="w-10 h-1 rounded-full"
                  style={{ backgroundColor: `${theme.text}20` }}
                />
              </div>

              {/* 菜单标题 */}
              <div className="px-6 py-3 border-b" style={{ borderColor: theme.lineColor }}>
                <h3 
                  className="text-base font-medium"
                  style={{ 
                    color: theme.text,
                    fontFamily: "'PingFang SC', -apple-system, BlinkMacSystemFont, sans-serif"
                  }}
                >
                  更多功能
                </h3>
              </div>

              {/* 菜单内容 */}
              <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
                
                {/* 学习模块列表 */}
                <div>
                  <p 
                    className="text-xs mb-3 opacity-60"
                    style={{ color: theme.text }}
                  >
                    学习模块
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {TABS.map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => {
                            setActiveTab(tab.id);
                            setIsThemeMenuOpen(false);
                          }}
                          className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all active:scale-95 touch-manipulation"
                          style={{
                            backgroundColor: isActive ? `${theme.accent}15` : `${theme.text}08`,
                            border: isActive ? `2px solid ${theme.accent}` : `1px solid ${theme.lineColor}`
                          }}
                        >
                          <Icon 
                            size={20} 
                            strokeWidth={2}
                            style={{ color: isActive ? theme.accent : theme.text }}
                          />
                          <span 
                            className="text-sm font-medium"
                            style={{ color: isActive ? theme.accent : theme.text }}
                          >
                            {tab.label}
                          </span>
                        </button>
                      );
                    })}
                    
                    {/* 导出按钮（放在交流右边） */}
                    {lesson && (
                      <button
                        onClick={() => {
                          // 根据当前模块显示对应的导出功能
                          // 这里只是占位，实际导出功能在下方
                        }}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all active:scale-95 touch-manipulation"
                        style={{
                          backgroundColor: `${theme.text}08`,
                          border: `1px solid ${theme.lineColor}`
                        }}
                      >
                        <Download 
                          size={20} 
                          strokeWidth={2}
                          style={{ color: theme.text }}
                        />
                        <span 
                          className="text-sm font-medium"
                          style={{ color: theme.text }}
                        >
                          导出
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 分隔线 */}
                <div className="h-px" style={{ backgroundColor: theme.lineColor }} />
                
                {/* 主题切换 */}
                <div>
                  <p 
                    className="text-xs mb-2 opacity-60 flex items-center gap-1.5"
                    style={{ color: theme.text }}
                  >
                    <Palette size={14} />
                    色板
                  </p>
                  <div className="flex gap-3">
                    {(Object.keys(THEMES) as CategoryKey[]).map((key) => {
                      const t = THEMES[key];
                      return (
                        <button
                          key={key}
                          onClick={() => {
                            setCurrentTheme(key);
                            setIsThemeMenuOpen(false);
                          }}
                          className="flex-1 flex flex-col items-center gap-2 p-3 rounded-lg transition-all active:scale-95 touch-manipulation"
                          style={{ 
                            backgroundColor: currentTheme === key ? `${theme.accent}15` : `${theme.text}08`,
                            border: currentTheme === key ? `2px solid ${theme.accent}` : `1px solid ${theme.lineColor}`
                          }}
                        >
                          <div 
                            className="w-8 h-8 rounded-md"
                            style={{ 
                              backgroundColor: t.bg,
                              border: `1.5px solid ${t.text}`,
                            }}
                          >
                            <div 
                              className="w-full h-full flex items-end justify-end p-1"
                            >
                              <div 
                                className="w-2 h-2 rounded-[1px]"
                                style={{ backgroundColor: t.accent }}
                              />
                            </div>
                          </div>
                          <span 
                            className="text-[10px] font-medium"
                            style={{ color: currentTheme === key ? theme.accent : theme.text }}
                          >
                            {key === 'daily' ? '日常' : key === 'cognitive' ? '认知' : '商务'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 关闭按钮 */}
              <div className="px-6 pb-6">
                <button
                  onClick={() => setIsThemeMenuOpen(false)}
                  className="w-full py-3 rounded-lg transition-all touch-manipulation"
                  style={{ 
                    backgroundColor: `${theme.text}08`,
                    color: theme.text
                  }}
                >
                  <span className="text-sm font-medium">关闭</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 🆕 订阅弹窗 */}
      <Suspense fallback={null}>
        <SubscriptionModal 
          isOpen={showSubscriptionModal} 
          onClose={() => setShowSubscriptionModal(false)} 
        />
      </Suspense>
    </div>
  );
}
