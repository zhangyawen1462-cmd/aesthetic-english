"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Type, Headphones, Mic, Layers, PenTool, Eye, MessageSquare, 
  Play, Pause 
} from "lucide-react";

// --- 引入所有 7 个模块 ---
import ModuleScript from "@/components/ModuleScript";
import ModuleBlind from "@/components/ModuleBlind";
import ModuleShadow from "@/components/ModuleShadow";
import ModuleVocab from "@/components/ModuleVocab";
import ModuleGrammar from "@/components/ModuleGrammar";
import ModuleRecall from "@/components/ModuleRecall"; // ✅ Module 06
import ModuleSalon from "@/components/ModuleSalon";   // ✅ Module 07

// --- 主题配置 ---
type ThemeKey = 'rice' | 'blue' | 'wine';
const THEMES = {
  rice: { label: "Rice Gallery", bg: "#EAE7DC", sidebar: "#E3E0D3", text: "#1C1C1C", accent: "#4A0404", highlight: "rgba(74, 4, 4, 0.06)", lineColor: "rgba(28, 28, 28, 0.06)" },
  blue: { label: "Ice Bookstore", bg: "#F0F4F8", sidebar: "#E1E7EC", text: "#243447", accent: "#0F4C81", highlight: "rgba(15, 76, 129, 0.06)", lineColor: "rgba(36, 52, 71, 0.06)" },
  wine: { label: "Vintage Cellar", bg: "#2E1C21", sidebar: "#25161A", text: "#E6DCCA", accent: "#D4A5A5", highlight: "rgba(255, 255, 255, 0.08)", lineColor: "rgba(255, 255, 255, 0.05)" }
};

const TABS = [
  { id: 'script', label: 'Script', num: 'I', icon: <Type size={20} /> },
  { id: 'blind', label: 'Blind', num: 'II', icon: <Headphones size={20} /> },
  { id: 'shadow', label: 'Shadow', num: 'III', icon: <Mic size={20} /> },
  { id: 'vocab', label: 'Vocab', num: 'IV', icon: <Layers size={20} /> },
  { id: 'grammar', label: 'Grammar', num: 'V', icon: <PenTool size={20} /> },
  { id: 'recall', label: 'Recall', num: 'VI', icon: <Eye size={20} /> },
  { id: 'salon', label: 'Salon', num: 'VII', icon: <MessageSquare size={20} /> },
];

export default function ScarlettGalleryPage() {
  const [activeTab, setActiveTab] = useState('script');
  const [currentTheme, setCurrentTheme] = useState<ThemeKey>('rice');
  const [leftWidth, setLeftWidth] = useState(50); 
  const [isDragging, setIsDragging] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0); 
  const [playbackRate, setPlaybackRate] = useState(1.0);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const theme = THEMES[currentTheme];

  const handleDrag = (e: MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    let newWidth = ((e.clientX - rect.left) / rect.width) * 100;
    if (newWidth < 30) newWidth = 30;
    if (newWidth > 70) newWidth = 70;
    setLeftWidth(newWidth);
  };

  useEffect(() => {
    const stopDrag = () => { setIsDragging(false); document.body.style.cursor = 'default'; document.body.style.userSelect = 'auto'; };
    const doDrag = (e: MouseEvent) => { if (isDragging) { handleDrag(e); document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none'; }};
    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('mousemove', doDrag);
    return () => { window.removeEventListener('mouseup', stopDrag); window.removeEventListener('mousemove', doDrag); };
  }, [isDragging]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = playbackRate;
  }, [playbackRate]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) { videoRef.current.play(); setIsPlaying(true); }
      else { videoRef.current.pause(); setIsPlaying(false); }
    }
  };

  const handleTimeUpdate = () => { if (videoRef.current) setCurrentTime(videoRef.current.currentTime); };
  const handleSeek = (t: number) => { if (videoRef.current) { videoRef.current.currentTime = t; videoRef.current.play(); setIsPlaying(true); } };

  return (
    <div ref={containerRef} className="h-screen w-full flex flex-col md:flex-row overflow-hidden transition-colors duration-700" style={{ backgroundColor: theme.bg, color: theme.text, fontFamily: "Verdana, sans-serif" }}>
      
      {/* 1. 视频区 */}
      <div className="relative bg-black flex items-center justify-center shrink-0 h-[35vh] md:h-full z-10 shadow-2xl transition-[width] duration-75" style={{ width: `${leftWidth}%` }}>
        <video ref={videoRef} src="https://aesthetic-assets.oss-cn-hongkong.aliyuncs.com/allure%E6%8B%89%E6%8B%89%E9%98%9F-%E5%89%AF%E6%9C%AC.mov" className="w-full h-full" style={{ objectFit: "contain" }} onClick={togglePlay} onTimeUpdate={handleTimeUpdate} playsInline />
        {!isPlaying && <div onClick={togglePlay} className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer hover:bg-black/10 transition-colors"><div className="w-20 h-20 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-lg"><Play size={32} className="text-white ml-1" fill="currentColor"/></div></div>}
      </div>

      {/* 2. 中轴线 */}
      <div onMouseDown={() => setIsDragging(true)} className="hidden md:flex relative z-50 items-center justify-center cursor-col-resize group" style={{ width: '1px' }}>
        <div className="absolute inset-y-0 -left-3 -right-3 bg-transparent z-50" />
        <div className="w-[1px] h-full transition-colors duration-300" style={{ backgroundColor: isDragging ? theme.accent : theme.lineColor }} />
      </div>

      {/* 3. 工作台 */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        <div className="flex-1 h-full relative overflow-hidden flex flex-col">
           {/* 主题切换 */}
           <div className="absolute top-6 right-8 z-30 flex gap-2"><div className="flex gap-2 bg-black/5 p-1 rounded-full backdrop-blur-sm transition-opacity opacity-20 hover:opacity-100">{(Object.keys(THEMES) as ThemeKey[]).map((key) => (<button key={key} onClick={() => setCurrentTheme(key)} className={`w-3 h-3 rounded-full transition-transform ${currentTheme === key ? 'scale-125 ring-1 ring-offset-1 ring-black/20' : ''}`} style={{ backgroundColor: THEMES[key].bg }} />))}</div></div>

           {/* 模块加载 */}
           {activeTab === 'script' && <ModuleScript currentTime={currentTime} isPlaying={isPlaying} theme={theme} setIsPlaying={setIsPlaying} onSeek={handleSeek} />}
           {activeTab === 'blind' && <ModuleBlind isPlaying={isPlaying} theme={theme} playbackRate={playbackRate} setPlaybackRate={setPlaybackRate} />}
           {activeTab === 'shadow' && <ModuleShadow theme={theme} currentTime={currentTime} videoRef={videoRef} />}
           {activeTab === 'vocab' && <ModuleVocab theme={theme} onSeek={handleSeek} />}
           {activeTab === 'grammar' && <ModuleGrammar theme={theme} onSeek={handleSeek} />}
           {/* ✅ 新增模块 */}
           {activeTab === 'recall' && <ModuleRecall theme={theme} />}
           {activeTab === 'salon' && <ModuleSalon />}
           
           {/* 底部播放胶囊 (Shadow 和 Salon 模式隐藏) */}
           {activeTab !== 'shadow' && activeTab !== 'salon' && (
             <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20">
               <button onClick={togglePlay} className="flex items-center gap-4 px-8 py-3 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:scale-105 active:scale-95 transition-all backdrop-blur-md border border-white/40" style={{ backgroundColor: theme.bg + 'CC', color: theme.text }}>
                 {isPlaying ? <Pause size={16} fill="currentColor"/> : <Play size={16} fill="currentColor"/>}
                 <span className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-80">{isPlaying ? "Pause" : "Start"}</span>
               </button>
             </div>
           )}
        </div>

        {/* 侧边栏 */}
        <div className="w-20 h-full border-l flex flex-col items-center py-10 gap-4 z-30 transition-colors duration-700" style={{ backgroundColor: theme.sidebar, borderColor: theme.lineColor }}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <motion.button key={tab.id} onClick={() => setActiveTab(tab.id)} whileHover="hover" initial="initial" className="relative w-full h-16 flex items-center justify-center group">
                <motion.div variants={{ initial: { x: 10, opacity: 0, width: "0rem" }, hover: { x: 0, opacity: 1, width: "16rem" } }} transition={{ type: "spring", stiffness: 200, damping: 25 }} className="absolute right-0 top-1/2 -translate-y-1/2 h-12 flex items-center justify-start pl-6 shadow-2xl z-20 pointer-events-none rounded-l-md" style={{ backgroundColor: theme.accent }}><span className="text-[#EAE7DC] text-base font-serif italic whitespace-nowrap pr-4">{tab.label}</span></motion.div>
                <div className={`w-10 h-10 flex items-center justify-center transition-all duration-500 relative z-40 rounded-sm ${isActive ? 'shadow-md scale-110' : 'opacity-40 group-hover:opacity-100'}`} style={{ backgroundColor: isActive ? theme.text : 'transparent', color: isActive ? theme.bg : theme.text }}><span style={{ fontFamily: '"Times New Roman", serif' }} className="text-xl font-bold">{tab.num}</span></div>
                {isActive && <motion.div layoutId="activeSideBar" className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-12" style={{ backgroundColor: theme.accent }} />}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}