"use client";

import React, { useState, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Type, Headphones, Mic, Layers, PenTool, Eye, MessageSquare,
  Play, Pause, ChevronLeft
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

// --- 数据层 ---
import { getLessonById } from "@/data/lessons";
import { parseSRT } from "@/lib/parse-srt";

// --- 统一配置 ---
import { THEMES, PAPER_TEXTURE, type CategoryKey, type ThemeConfig } from "@/lib/theme-config";
import { ANIMATION_CONFIG } from "@/lib/animation-config";

// --- 自定义 Hooks ---
import { useResponsive } from "@/lib/hooks/useResponsive";
import { useVideoControl } from "@/lib/hooks/useVideoControl";
import { useResizablePanel } from "@/lib/hooks/useResizablePanel";
import { useKeyboardShortcuts } from "@/lib/hooks/useKeyboardShortcuts";

// --- 子模块 ---
import ModuleScript from "@/components/ModuleScript";
import ModuleBlind from "@/components/ModuleBlind";
import ModuleShadow from "@/components/ModuleShadow";
import ModuleVocab from "@/components/ModuleVocab";
import ModuleGrammar from "@/components/ModuleGrammar";
import ModuleRecall from "@/components/ModuleRecall";
import ModuleSalon from "@/components/ModuleSalon";

const TABS = [
  { id: 'script', label: 'Script', num: 'I', icon: <Type size={16} /> },
  { id: 'blind', label: 'Blind', num: 'II', icon: <Headphones size={16} /> },
  { id: 'shadow', label: 'Shadow', num: 'III', icon: <Mic size={16} /> },
  { id: 'vocab', label: 'Vocab', num: 'IV', icon: <Layers size={16} /> },
  { id: 'grammar', label: 'Grammar', num: 'V', icon: <PenTool size={16} /> },
  { id: 'recall', label: 'Recall', num: 'VI', icon: <Eye size={16} /> },
  { id: 'salon', label: 'Salon', num: 'VII', icon: <MessageSquare size={16} /> },
];

/** 格式化时间 mm:ss */
function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function CoursePage() {
  const params = useParams<{ category: string; courseId: string }>();
  const category = (params?.category || 'daily') as CategoryKey;
  const courseId = params?.courseId || '';

  const lesson = getLessonById(courseId);
  const transcript = useMemo(
    () => (lesson ? parseSRT(lesson.srtRaw) : []),
    [lesson]
  );

  // --- 状态 ---
  const [activeTab, setActiveTab] = useState('script');
  const [currentTheme, setCurrentTheme] = useState<CategoryKey>(category);

  // --- Hooks ---
  const videoRef = useRef<HTMLVideoElement>(null);
  const isMobile = useResponsive();
  const { containerRef, leftWidth, isDragging, setIsDragging } = useResizablePanel(50, 30, 70);
  const {
    isPlaying, currentTime, duration, playbackRate,
    setIsPlaying, setPlaybackRate, togglePlay, handleSeek,
    handleTimeUpdate, handleLoadedMetadata,
  } = useVideoControl(videoRef);

  const theme: ThemeConfig = THEMES[currentTheme];

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

  // --- 课程未找到 ---
  if (!lesson) {
    return (
      <div className="h-[100dvh] w-full flex flex-col items-center justify-center bg-ecru">
        <p className="font-serif text-2xl md:text-3xl italic text-plum-wine mb-4">Lesson Not Found</p>
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
      className="h-[100dvh] w-full flex flex-col md:flex-row overflow-hidden transition-colors duration-700 select-none"
      style={{ backgroundColor: theme.bg, color: theme.text, filter: 'contrast(1.02)' }}
    >

      {/* ═══════════════════════════════════════
          1. 视频区域
          - 移动端: 自适应 16:9（minHeight 240px, maxHeight 40dvh）
          - 桌面端: 可拖拽宽度
         ═══════════════════════════════════════ */}
      <div
        className="relative bg-black flex items-center justify-center shrink-0 z-10 shadow-2xl transition-all overflow-hidden w-full md:h-full md:basis-auto"
        style={{
          height: isMobile ? 'auto' : '100%',
          minHeight: isMobile ? '240px' : 'auto',
          maxHeight: isMobile ? '40dvh' : 'auto',
          aspectRatio: isMobile ? '16 / 9' : 'auto',
          width: isMobile ? '100%' : `${leftWidth}%`,
        }}
      >
        {/* 返回按钮 — 移动端加大触控区 */}
        <Link
          href={`/course/${category}`}
          className="absolute top-3 left-3 md:top-4 md:left-4 z-50 text-white/40 hover:text-white transition-colors p-1"
        >
          <ChevronLeft size={22} />
        </Link>

        {/* 课程标题（仅移动端显示在视频区角落） */}
        {isMobile && (
          <div className="absolute top-3 right-4 z-50 text-right">
            <p className="text-[9px] uppercase tracking-[0.15em] text-white/30 font-medium">{lesson.ep && `EP.${lesson.ep}`}</p>
          </div>
        )}

        {lesson.videoUrl ? (
          <video
            ref={videoRef}
            src={lesson.videoUrl}
            className="w-full h-full object-contain"
            onClick={togglePlay}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            playsInline
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-white/30">
            <Play size={32} className="mb-3 opacity-30" />
            <p className="text-[10px] uppercase tracking-[0.15em]">Video Coming Soon</p>
          </div>
        )}

        {/* 播放区域底部微渐变，让进度条区域自然过渡 */}
        <div
          className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none z-20"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)' }}
        />

        {!isPlaying && lesson.videoUrl && (
          <div onClick={togglePlay} className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 cursor-pointer z-[25]">
            <div className="w-14 h-14 md:w-20 md:h-20 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-lg active:scale-95 transition-transform">
              <Play size={24} className="text-white ml-0.5" fill="currentColor" />
            </div>
            <p className="mt-4 text-white/70 text-sm font-serif max-w-[80%] text-center px-4">{lesson.titleEn}</p>
            {lesson.ep != null && <p className="mt-1 text-[10px] uppercase tracking-widest text-white/40">EP.{lesson.ep}</p>}
          </div>
        )}

        {/* 视频进度条：半透明渐变背景 + hover 膨胀 + 圆形手柄，时间 hover 渐入 */}
        {lesson.videoUrl && (
          <div className="absolute bottom-0 left-0 right-0 z-30 group/progress">
            <div
              className="h-[2px] group-hover/progress:h-1.5 cursor-pointer transition-all duration-200 flex items-center"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%)' }}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                if (duration > 0) {
                  handleSeek(percent * duration);
                }
              }}
            >
              <div className="absolute inset-0 bg-white/10" />
              <motion.div
                className="h-full relative transition-colors rounded-full min-w-0"
                style={{
                  width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%',
                  backgroundColor: theme.accent,
                }}
              >
                {/* 圆形拖拽手柄 12px — hover 时更明显 */}
                <div
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-md border border-white/30 opacity-0 group-hover/progress:opacity-100 transition-opacity"
                  style={{ transform: 'translate(50%, -50%)' }}
                />
              </motion.div>
            </div>
            {/* 时间显示：hover 进度条区域时渐入 */}
            <div className="flex justify-between px-4 py-1.5 text-[9px] text-white/40 opacity-0 group-hover/progress:opacity-100 transition-opacity">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        )}
      </div>

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
          3. 工作台 — 三层纹理 + 径向渐变深度
         ═══════════════════════════════════════ */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative z-10">
        {/* 底层：极淡径向渐变（中心微亮 → 边缘渐暗） */}
        <div
          className="pointer-events-none absolute inset-0 z-0 opacity-60"
          style={{
            background: `radial-gradient(ellipse 80% 80% at 50% 50%, ${theme.bg} 0%, ${theme.bg}00 70%)`,
          }}
        />
        {/* 第1层：纸张纤维 */}
        <div
          className="pointer-events-none absolute inset-0 z-0 mix-blend-soft-light"
          style={{ backgroundImage: PAPER_TEXTURE.fine, opacity: 1 }}
        />
        {/* 第2层：做旧 */}
        <div
          className="pointer-events-none absolute inset-0 z-0 mix-blend-multiply"
          style={{ backgroundImage: PAPER_TEXTURE.aged, opacity: 1 }}
        />
        {/* 第3层：哑光 blur */}
        <div className="pointer-events-none absolute inset-0 z-0 matte-surface" />

        {/* ─── 移动端 Tab 导航：毛玻璃增强 + 发光指示条 + 分隔线 + 活跃缩放 ─── */}
        <nav
          className="flex md:hidden overflow-x-auto no-scrollbar shrink-0 snap-x snap-mandatory safe-bottom relative"
          style={{
            borderBottom: `1px solid ${theme.lineColor}`,
            background: theme.bg + 'E6',
            backdropFilter: 'blur(12px) saturate(180%)',
            WebkitBackdropFilter: 'blur(12px) saturate(180%)',
            boxShadow: `0 -1px 0 0 ${theme.lineColor}18`,
          }}
        >
          {TABS.map((tab, index) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative flex flex-col items-center justify-center gap-1 snap-center
                  min-w-[62px] px-3 py-3
                  transition-all duration-300 touch-active
                  ${isActive ? 'opacity-100 scale-105 font-semibold' : 'opacity-30 active:opacity-60'}
                `}
              >
                {index < TABS.length - 1 && (
                  <span
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 opacity-[0.05]"
                    style={{ backgroundColor: theme.text }}
                  />
                )}
                <span
                  className="text-sm leading-none"
                  style={{ fontFamily: 'Georgia, serif', fontWeight: isActive ? 700 : 400 }}
                >
                  {tab.num}
                </span>
                <span className="text-[8px] uppercase tracking-[0.1em] font-medium leading-none mt-0.5">
                  {tab.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="mobileTab"
                    className="h-1 w-5 rounded-full mt-1"
                    style={{
                      backgroundColor: theme.accent,
                      boxShadow: `0 0 8px ${theme.accent}99`,
                    }}
                    transition={{ type: "spring", ...ANIMATION_CONFIG.spring.medium }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div className="flex-1 h-full relative overflow-hidden flex flex-col">

          {/* 主题切换 + 课程标题 */}
          <div className="absolute top-3 right-4 md:top-6 md:right-8 z-30 flex items-center gap-3">
            <span className="hidden md:inline text-[10px] uppercase tracking-[0.15em] opacity-30 font-medium">
              {lesson.titleEn}
            </span>
            <div className="flex gap-1.5 md:gap-2 bg-black/5 p-1 md:p-1.5 rounded-full backdrop-blur-sm transition-opacity opacity-30 hover:opacity-100">
              {(Object.keys(THEMES) as CategoryKey[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setCurrentTheme(key)}
                  className={`w-3 h-3 md:w-3 md:h-3 rounded-full transition-all ${currentTheme === key ? 'scale-125 ring-1 ring-offset-1 ring-black/20' : ''}`}
                  style={{ backgroundColor: THEMES[key].bg }}
                />
              ))}
            </div>
          </div>

          {/* ─── 模块内容区（三层纹理 + 左侧 inset 嵌入感） ─── */}
          <div
            className="flex-1 overflow-y-auto p-4 pt-6 md:p-8 md:pt-6 pb-28 md:pb-10 no-scrollbar relative"
            style={{ boxShadow: `inset 8px 0 12px -8px ${theme.lineColor}40` }}
          >
            {/* 内容区三层纹理 */}
            <div className="pointer-events-none absolute inset-0 z-0 mix-blend-soft-light" style={{ backgroundImage: PAPER_TEXTURE.fine, opacity: 1 }} />
            <div className="pointer-events-none absolute inset-0 z-0 mix-blend-multiply" style={{ backgroundImage: PAPER_TEXTURE.aged, opacity: 1 }} />
            <div className="pointer-events-none absolute inset-0 z-0 matte-surface" />
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={ANIMATION_CONFIG.pageTransition.initial}
                animate={ANIMATION_CONFIG.pageTransition.animate}
                exit={ANIMATION_CONFIG.pageTransition.exit}
                transition={{ duration: ANIMATION_CONFIG.duration.fast }}
                className="h-full relative z-10"
              >
                {activeTab === 'script' && (
                  <ModuleScript currentTime={currentTime} isPlaying={isPlaying} theme={theme} setIsPlaying={setIsPlaying} onSeek={handleSeek} transcript={transcript} lessonId={lesson.id} />
                )}
                {activeTab === 'blind' && (
                  <ModuleBlind isPlaying={isPlaying} theme={theme} playbackRate={playbackRate} setPlaybackRate={setPlaybackRate} />
                )}
                {activeTab === 'shadow' && (
                  <ModuleShadow theme={theme} currentTime={currentTime} videoRef={videoRef} transcript={transcript} />
                )}
                {activeTab === 'vocab' && (
                  <ModuleVocab theme={theme} vocab={lesson.vocab} lessonId={lesson.id} />
                )}
                {activeTab === 'grammar' && (
                  <ModuleGrammar theme={theme} onSeek={handleSeek} grammarNotes={lesson.grammar} lessonId={lesson.id} />
                )}
                {activeTab === 'recall' && (
                  <ModuleRecall theme={theme} recallText={lesson.recall} />
                )}
                {activeTab === 'salon' && (
                  <ModuleSalon theme={theme} data={lesson.salon} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ─── 底部播放控制 ─── */}
          {activeTab !== 'shadow' && activeTab !== 'salon' && (
            <div className="absolute bottom-4 md:bottom-10 left-1/2 -translate-x-1/2 z-20 safe-bottom">
              <button
                onClick={togglePlay}
                className="flex items-center gap-2.5 px-5 py-2.5 md:px-8 md:py-3 rounded-full active:scale-95 transition-all backdrop-blur-xl border shadow-[0_4px_24px_rgba(0,0,0,0.12)]"
                style={{ backgroundColor: theme.bg + 'CC', color: theme.text, borderColor: theme.accent + '40' }}
              >
                {isPlaying ? <Pause size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}
                <span className="text-[9px] md:text-[10px] uppercase tracking-[0.15em] md:tracking-[0.25em] font-bold opacity-80">
                  {isPlaying ? "Pause" : "Start"}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* ─── 桌面侧边栏（纸张纹理 + 磨砂 active + hover 动效 + 信息锚点） ─── */}
        <div
          className="hidden md:flex w-20 h-full border-l flex-col items-center py-10 gap-4 z-30 transition-colors duration-700 relative"
          style={{ backgroundColor: theme.sidebar, borderColor: theme.lineColor }}
        >
          {/* 侧边栏纸张纹理 */}
          <div
            className="pointer-events-none absolute inset-0 z-0 mix-blend-soft-light"
            style={{ backgroundImage: PAPER_TEXTURE.fine, opacity: 1 }}
          />
          {TABS.map((tab, index) => {
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                whileHover="hover"
                initial="initial"
                className="relative w-full h-16 flex items-center justify-center group"
              >
                {/* Hover tooltip */}
                <motion.div
                  variants={{
                    initial: { x: 10, opacity: 0, width: "0rem" },
                    hover: { x: 0, opacity: 1, width: "12rem" },
                  }}
                  transition={{ type: "spring", ...ANIMATION_CONFIG.spring.slow }}
                  className="absolute right-0 top-1/2 -translate-y-1/2 h-10 flex items-center justify-start pl-6 shadow-2xl z-20 pointer-events-none rounded-l-sm"
                  style={{ backgroundColor: theme.accent }}
                >
                  <span className="text-white text-sm font-serif italic whitespace-nowrap pr-4">{tab.label}</span>
                </motion.div>

                {/* Tab button — active 磨砂卡片：微妙投影 + accent 底色渐变 */}
                <motion.div
                  variants={{ initial: { scale: 1 }, hover: { scale: isActive ? 1 : 1.05 } }}
                  transition={{ type: "spring", ...ANIMATION_CONFIG.spring.medium }}
                  className={`w-10 h-10 flex items-center justify-center transition-all duration-300 relative z-40 rounded-sm ${isActive ? 'shadow-md' : 'opacity-40 group-hover:opacity-100 group-hover:bg-black/5'}`}
                  style={{
                    backgroundColor: isActive ? undefined : 'transparent',
                    color: isActive ? theme.bg : theme.text,
                    background: isActive ? `linear-gradient(135deg, ${theme.text} 0%, ${theme.text}E8 100%)` : undefined,
                    boxShadow: isActive ? `0 2px 8px ${theme.lineColor}50` : undefined,
                  }}
                >
                  <span style={{ fontFamily: 'Georgia, serif' }} className="text-xl font-bold">{tab.num}</span>
                </motion.div>

                {/* Active indicator — 4px 圆角 */}
                {isActive && (
                  <motion.div
                    layoutId="activeSideBar"
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-12 rounded-l"
                    style={{ backgroundColor: theme.accent }}
                    transition={{ type: "spring", ...ANIMATION_CONFIG.spring.medium }}
                  />
                )}

                {/* 快捷键数字 — hover 时渐入 */}
                <span className="absolute bottom-0.5 text-[8px] font-mono opacity-0 group-hover:opacity-30 transition-opacity" style={{ color: theme.text }}>
                  {index + 1}
                </span>
              </motion.button>
            );
          })}
          {/* 底部版本/课程信息锚点 */}
          <div className="mt-auto pt-4 pb-2 z-10">
            <p className="text-[8px] uppercase tracking-[0.12em] opacity-25 font-medium" style={{ color: theme.text }}>
              {lesson.ep != null ? `EP.${lesson.ep}` : ''}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
