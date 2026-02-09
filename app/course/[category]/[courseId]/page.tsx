"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, Pause, Mic, RotateCcw, Settings, Bookmark, Highlighter, 
  Layers, Mic2, Headphones, Sparkles, BookOpen, Send, 
  MoveHorizontal, Eye, Volume2, MoreHorizontal, X, FileText, PenTool,
  Palette, CheckCircle2, User, Bot
} from "lucide-react";

// --- 0. 核心配置与主题引擎 ---

type ThemeType = {
  id: string;
  name: string;
  bg: string;     // 页面背景
  panel: string;  // 模块/卡片背景
  text: string;   // 主文字颜色
  sub: string;    // 次级文字颜色
  accent: string; // 强调色（按钮/高亮）
  border: string; // 边框颜色
  highlight: string; // 单词高亮底色
};

const THEMES: Record<string, ThemeType> = {
  daily: {
    id: "daily",
    name: "Daily",
    bg: "bg-[#F2EFE5]", 
    panel: "bg-[#F9F8F3]", 
    text: "text-[#2D0F15]", 
    sub: "text-[#2D0F15]/60",
    accent: "bg-[#2D0F15]", 
    border: "border-[#2D0F15]/10",
    highlight: "bg-[#E6D5B8]", 
  },
  cognitive: {
    id: "cognitive",
    name: "Cognitive",
    bg: "bg-[#D8E3E7]", 
    panel: "bg-[#EBF1F3]",
    text: "text-[#1E293B]", 
    sub: "text-[#1E293B]/60",
    accent: "bg-[#334155]", 
    border: "border-[#1E293B]/10",
    highlight: "bg-[#BFDBFE]", 
  },
  business: {
    id: "business",
    name: "Business",
    bg: "bg-[#2D0F15]", 
    panel: "bg-[#200A0F]",
    text: "text-[#E8E4D9]", 
    sub: "text-[#E8E4D9]/50",
    accent: "bg-[#E8E4D9]", 
    border: "border-[#E8E4D9]/20",
    highlight: "bg-[#5D2E36]", 
  }
};

const MOCK_SCRIPT = [
  { id: 1, start: 0, end: 3, en: "I brew my coffee, not for the caffeine, but for the ritual.", cn: "我冲泡咖啡，不为咖啡因，只为这份仪式感。" },
  { id: 2, start: 3.5, end: 6, en: "The morning light hits the cup just right.", cn: "晨光恰好洒在杯子上。" },
  { id: 3, start: 6.5, end: 9, en: "It creates a moment of silence before the chaos begins.", cn: "在混乱开始前，创造片刻的宁静。" },
  { id: 4, start: 9.5, end: 12, en: "This is the essence of daily aesthetics.", cn: "这就是日常美学的真谛。" },
];

const MOCK_GRAMMAR = [
  { id: 1, title: "Parallel Structure", sentence: "Not for the caffeine, but for the ritual.", highlight: ["Not for", "but for"], explanation: "Rhythmic balance contrasting utility vs emotion." },
];

const VIDEO_SRC = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"; 

// --- 1. 通用组件：Toast 通知 ---
const Toast = ({ message, theme }: { message: string | null, theme: ThemeType }) => (
  <AnimatePresence>
    {message && (
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.9 }}
        className={`fixed bottom-8 right-8 z-50 px-6 py-3 rounded-lg shadow-xl flex items-center gap-3 border ${theme.border} ${theme.panel} ${theme.text}`}
      >
        <CheckCircle2 size={18} className="text-green-600" />
        <span className="text-xs uppercase tracking-wider font-bold">{message}</span>
      </motion.div>
    )}
  </AnimatePresence>
);

// --- 2. 组件：悬挂式主题书签 (The Hanging Bookmark) ---
const ThemeBookmark = ({ currentTheme, setTheme }: { currentTheme: ThemeType, setTheme: (k: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div 
      className="absolute top-0 right-10 z-50 flex flex-col items-end"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* 悬挂的标签头部 */}
      <div className={`
        w-8 h-10 rounded-b-lg shadow-md cursor-pointer transition-all duration-300 flex items-end justify-center pb-2
        ${currentTheme.accent}
      `}>
        <Palette size={14} className={currentTheme.id === 'business' ? 'text-black' : 'text-white'} />
      </div>

      {/* 下拉选择区 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`
              mt-1 p-2 rounded-lg shadow-xl overflow-hidden flex flex-col gap-2 border
              ${currentTheme.panel} ${currentTheme.border}
            `}
          >
            {Object.keys(THEMES).map((key) => (
              <button
                key={key}
                onClick={() => setTheme(key)}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-black/5 transition-colors group`}
              >
                <div className={`w-3 h-3 rounded-full ${THEMES[key].bg} border border-black/10`} />
                <span className={`text-[9px] uppercase tracking-widest ${currentTheme.text} opacity-70 group-hover:opacity-100`}>
                  {THEMES[key].name}
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- 3. 模块：交互字幕 (Script) ---
const ScriptModule = ({ currentTime, onSeek, settings, theme, onSaveToNotebook }: any) => {
  const activeIndex = MOCK_SCRIPT.findIndex(s => currentTime >= s.start && currentTime <= s.end);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [highlightedWords, setHighlightedWords] = useState<string[]>([]);
  const [contextMenu, setContextMenu] = useState<{id: string, text: string, x: number, y: number} | null>(null);

  useEffect(() => {
    if (activeIndex !== -1 && scrollRef.current) {
      const activeEl = scrollRef.current.children[activeIndex] as HTMLElement;
      if (activeEl) activeEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeIndex]);

  const handleWordClick = (wordId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (highlightedWords.includes(wordId)) {
      setHighlightedWords(prev => prev.filter(id => id !== wordId));
    } else {
      setHighlightedWords(prev => [...prev, wordId]);
    }
  };

  const handleRightClick = (wordId: string, wordText: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const x = Math.min(e.clientX, window.innerWidth - 160);
    const y = Math.min(e.clientY, window.innerHeight - 150);
    setContextMenu({ id: wordId, text: wordText, x, y });
  };

  return (
    <div className={`h-full flex flex-col relative ${theme.text}`} onClick={() => setContextMenu(null)}>
      <div className={`flex items-center gap-3 mb-6 opacity-80 ${theme.text}`}>
        <Layers size={16} />
        <h3 className="text-[10px] uppercase tracking-[0.2em] font-sans font-bold">Interactive Script</h3>
        <div className={`h-[1px] flex-1 opacity-20 bg-current`} />
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar pb-20" ref={scrollRef}>
        {MOCK_SCRIPT.map((line, idx) => {
          const isActive = idx === activeIndex;
          const words = line.en.split(" "); 
          return (
            <motion.div 
              key={line.id}
              initial={{ opacity: 0.5 }}
              animate={{ opacity: isActive ? 1 : 0.5, scale: isActive ? 1.02 : 1, x: isActive ? 10 : 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              onClick={() => onSeek(line.start)}
              className={`p-5 rounded-lg cursor-pointer transition-all duration-300 relative group
                ${isActive ? `${theme.panel} shadow-sm border-l-2 border-current` : "hover:bg-current/5 border-l-2 border-transparent"}
              `}
            >
              {(settings.showEn || settings.showDual) && (
                <div className="font-serif text-lg md:text-xl leading-relaxed mb-3 flex flex-wrap gap-x-[0.3em] gap-y-1 relative z-10">
                  {words.map((word, wIdx) => {
                    const cleanWord = word.replace(/[.,]/g, ''); 
                    const wordId = `${line.id}-${wIdx}`;
                    const isHi = highlightedWords.includes(wordId);
                    return (
                      <span 
                        key={wIdx}
                        onClick={(e) => handleWordClick(wordId, e)}
                        onContextMenu={(e) => handleRightClick(wordId, cleanWord, e)}
                        className={`relative px-1 -mx-1 rounded-sm transition-colors cursor-pointer select-none ${isHi ? theme.highlight : "hover:bg-current/10"} ${isHi && theme.id === 'business' ? 'text-white' : ''}`}
                      >
                        {word}
                      </span>
                    )
                  })}
                </div>
              )}
              {(settings.showCn || settings.showDual) && (
                <p className={`font-sans text-xs tracking-wide pl-1 opacity-60 ${theme.sub} relative z-0`}>{line.cn}</p>
              )}
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {contextMenu && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{ top: contextMenu.y, left: contextMenu.x }}
            className={`fixed z-50 bg-white shadow-xl rounded-lg p-1.5 min-w-[160px] flex flex-col gap-1 border border-black/10 text-gray-800`}
            onClick={(e) => e.stopPropagation()} 
          >
             <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider opacity-50 border-b border-gray-100 mb-1">Selected: "{contextMenu.text}"</div>
             <button onClick={() => { onSaveToNotebook(contextMenu.text, "vocabulary"); setContextMenu(null); }} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded text-xs text-left transition-colors"><Bookmark size={14} className="text-yellow-600"/> Save to Notebook</button>
             <button onClick={() => { onSaveToNotebook(contextMenu.text, "phrase"); setContextMenu(null); }} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded text-xs text-left transition-colors"><Highlighter size={14} className="text-blue-600"/> Add Note</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- 4. 模块：语法 (Grammar) ---
const GrammarModule = ({ theme, onSaveToNotebook }: any) => (
  <div className={`h-full flex flex-col ${theme.text}`}>
    <div className={`flex items-center gap-3 mb-6 opacity-80 ${theme.text}`}>
      <BookOpen size={16} />
      <h3 className="text-[10px] uppercase tracking-[0.2em] font-sans font-bold">Grammar Notes</h3>
      <div className={`h-[1px] flex-1 opacity-20 bg-current`} />
    </div>
    
    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
      {MOCK_GRAMMAR.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`p-6 rounded-lg border ${theme.border} ${theme.panel} hover:shadow-md transition-shadow duration-300`}
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-serif text-lg italic font-bold">{item.title}</h4>
            <span className={`text-[9px] uppercase tracking-widest px-2 py-1 rounded-full border ${theme.border} opacity-50`}>Rule {index + 1}</span>
          </div>
          <div className={`p-4 rounded-md mb-4 bg-black/5 relative overflow-hidden`}>
            <p className="font-serif text-lg leading-relaxed relative z-10">"{item.sentence}"</p>
            <div className={`absolute bottom-0 left-0 h-1 ${theme.accent} opacity-20 w-full`} />
          </div>
          <div className="flex gap-3">
            <PenTool size={16} className="shrink-0 mt-1 opacity-50" />
            <p className={`text-xs leading-relaxed opacity-80 font-sans tracking-wide`}>{item.explanation}</p>
          </div>
          <div className="mt-4 pt-4 border-t border-black/5 flex justify-end">
             <button onClick={() => onSaveToNotebook(item.title, "grammar")} className={`text-[10px] uppercase tracking-widest opacity-50 hover:opacity-100 flex items-center gap-2 hover:${theme.text}`}><Bookmark size={12} /> Save Note</button>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

// --- 5. 模块：影子跟读 (Shadowing) ---
const ShadowingModule = ({ theme, videoRef }: any) => {
  const [mode, setMode] = useState<'sequential' | 'simultaneous'>('sequential');
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const handleRecordToggle = () => {
    if (isRecording) {
      setIsRecording(false);
      setAudioUrl("mock_audio_blob"); 
      if (mode === 'simultaneous' && videoRef.current) videoRef.current.pause();
    } else {
      setIsRecording(true);
      setAudioUrl(null);
      if (mode === 'simultaneous' && videoRef.current) {
        videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 0.5); 
        videoRef.current.play(); 
      }
    }
  };

  return (
    <div className={`h-full flex flex-col ${theme.text}`}>
      <div className={`flex items-center gap-3 mb-6 opacity-80 ${theme.text}`}>
        <Mic2 size={16} />
        <h3 className="text-[10px] uppercase tracking-[0.2em] font-sans font-bold">Shadowing Studio</h3>
        <div className={`h-[1px] flex-1 opacity-20 bg-current`} />
      </div>

      <div className={`flex p-1 rounded-lg mb-8 border ${theme.border} bg-black/5`}>
        {['sequential', 'simultaneous'].map((m) => (
          <button
            key={m}
            onClick={() => setMode(m as any)}
            className={`flex-1 py-2 text-[10px] uppercase tracking-wider rounded-md transition-all ${mode === m ? "bg-white shadow-sm font-bold opacity-100 text-black" : "opacity-50 hover:opacity-80"}`}
          >
            {m === 'sequential' ? 'Step-by-Step' : 'Sync Mode'}
          </button>
        ))}
      </div>
      <div className="flex-1 flex flex-col items-center justify-center relative">
        <div className="absolute top-0 w-full text-center">
          <p className={`text-xs opacity-50 font-serif italic ${theme.sub}`}>
            {mode === 'simultaneous' ? "🎧 Headphones required." : "Listen first, then record."}
          </p>
        </div>
        <div className="relative group cursor-pointer mt-10" onClick={handleRecordToggle}>
           {isRecording && (
             <>
              <motion.div animate={{ scale: [1, 2.5], opacity: [0.3, 0] }} transition={{ repeat: Infinity, duration: 1.5 }} className={`absolute inset-0 rounded-full ${theme.accent}`} />
              <motion.div animate={{ scale: [1, 1.8], opacity: [0.5, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.5 }} className={`absolute inset-0 rounded-full ${theme.accent}`} />
             </>
           )}
           <motion.div whileTap={{ scale: 0.95 }} animate={{ scale: isRecording ? 1.1 : 1 }} className={`w-24 h-24 rounded-full flex items-center justify-center shadow-xl border-4 transition-colors duration-300 z-10 relative ${isRecording ? "bg-red-800 border-red-900 text-white" : `${theme.panel} ${theme.border} ${theme.text}`}`}>
             {isRecording ? <div className="w-8 h-8 bg-white rounded-sm animate-pulse" /> : <Mic size={32} />}
           </motion.div>
        </div>
        <p className={`mt-8 text-xs uppercase tracking-[0.2em] opacity-60 animate-pulse ${theme.text}`}>{isRecording ? "Recording..." : "Tap to Start"}</p>
      </div>
    </div>
  );
};

// --- NEW MODULE: 盲听 (Blind Listening) ---
const BlindModule = ({ theme, playbackSpeed, setPlaybackSpeed }: any) => (
  <div className={`h-full flex flex-col items-center justify-center ${theme.text}`}>
    <div className={`w-full flex items-center gap-3 mb-6 opacity-80 ${theme.text}`}>
      <Headphones size={16} />
      <h3 className="text-[10px] uppercase tracking-[0.2em] font-sans font-bold">Blind Listening</h3>
      <div className={`h-[1px] flex-1 opacity-20 bg-current`} />
    </div>

    {/* 旋转黑胶/波形动画 */}
    <div className="flex-1 flex flex-col items-center justify-center w-full">
       <div className="w-48 h-48 rounded-full border-[1px] border-current opacity-20 flex items-center justify-center mb-10 animate-[spin_8s_linear_infinite]">
          <div className="w-16 h-16 rounded-full bg-current opacity-10" />
          <div className="absolute w-2 h-2 bg-current rounded-full top-4 left-1/2" />
       </div>

       <div className="flex gap-4">
         {[0.75, 1, 1.25].map(speed => (
           <button
             key={speed}
             onClick={() => setPlaybackSpeed(speed)}
             className={`
               w-14 h-14 rounded-full border flex items-center justify-center text-xs font-mono
               transition-all duration-300
               ${playbackSpeed === speed ? `${theme.accent} text-white border-transparent scale-110 shadow-lg` : `${theme.border} hover:border-current`}
             `}
           >
             {speed}x
           </button>
         ))}
       </div>
       <p className={`mt-10 text-xs opacity-50 font-serif italic max-w-xs text-center`}>
         Focus on the intonation without visual aid.
       </p>
    </div>
  </div>
);

// --- NEW MODULE: AI 角色扮演 (Roleplay) ---
const RoleplayModule = ({ theme }: { theme: ThemeType }) => (
  <div className={`h-full flex flex-col ${theme.text}`}>
    <div className={`flex items-center gap-3 mb-6 opacity-80 ${theme.text}`}>
      <Bot size={16} />
      <h3 className="text-[10px] uppercase tracking-[0.2em] font-sans font-bold">AI Roleplay</h3>
      <div className={`h-[1px] flex-1 opacity-20 bg-current`} />
    </div>

    {/* Chat Area */}
    <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar mb-4">
      {/* AI Message */}
      <div className="flex gap-4 items-start">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${theme.accent} text-white`}>
          <Bot size={14} />
        </div>
        <div className={`p-4 rounded-r-xl rounded-bl-xl ${theme.panel} border ${theme.border} text-sm font-serif leading-relaxed max-w-[85%]`}>
          <p>Let's practice the phrase <em>"not for... but for..."</em>. <br/>Why do you wake up so early every day?</p>
        </div>
      </div>

      {/* User Message */}
      <div className="flex gap-4 items-start flex-row-reverse">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${theme.border} opacity-70`}>
          <User size={14} />
        </div>
        <div className={`p-4 rounded-l-xl rounded-br-xl bg-black/5 text-sm font-sans leading-relaxed max-w-[85%] opacity-80`}>
          <p>I wake up early, not for work, but for the quiet morning hours.</p>
        </div>
      </div>

       {/* AI Reply (Mock) */}
       <div className="flex gap-4 items-start">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${theme.accent} text-white`}>
          <Bot size={14} />
        </div>
        <div className={`p-4 rounded-r-xl rounded-bl-xl ${theme.panel} border ${theme.border} text-sm font-serif leading-relaxed max-w-[85%]`}>
          <p>Perfect usage! The contrast is very clear.</p>
        </div>
      </div>
    </div>

    {/* Input Area */}
    <div className={`p-2 border-t ${theme.border} flex items-center gap-2`}>
       <input 
         type="text" 
         placeholder="Type your response..." 
         className="flex-1 bg-transparent border-none focus:ring-0 text-sm p-2 font-sans opacity-80"
       />
       <button className={`p-2 rounded-full ${theme.accent} text-white hover:opacity-90 transition-opacity`}>
         <Send size={16} />
       </button>
    </div>
  </div>
);

// --- 主页面 ---

export default function StudioPage({ params }: { params: { id: string } }) {
  const [currentThemeKey, setCurrentThemeKey] = useState<"daily" | "cognitive" | "business">("daily");
  const theme = THEMES[currentThemeKey];
  const [activeTab, setActiveTab] = useState("script");
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  
  const [leftPanelWidth, setLeftPanelWidth] = useState(60);
  const [isDragging, setIsDragging] = useState(false);

  // 监听倍速变化
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // 模拟保存到 Notebook
  const handleSaveToNotebook = (content: string, type: string) => {
    console.log(`Saving ${type}: ${content}`);
    setToastMsg(`Saved "${content.substring(0, 15)}..." to Notebook`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleDrag = useCallback((e: MouseEvent) => {
    const newWidth = (e.clientX / window.innerWidth) * 100;
    if (newWidth > 30 && newWidth < 70) setLeftPanelWidth(newWidth);
  }, []);

  const stopDrag = useCallback(() => {
    setIsDragging(false);
    document.removeEventListener("mousemove", handleDrag);
    document.removeEventListener("mouseup", stopDrag);
    document.body.style.cursor = "default";
  }, [handleDrag]);

  const startDrag = () => {
    setIsDragging(true);
    document.addEventListener("mousemove", handleDrag);
    document.addEventListener("mouseup", stopDrag);
    document.body.style.cursor = "col-resize";
  };

  const togglePlay = () => {
    if (videoRef.current) {
      isPlaying ? videoRef.current.pause() : videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <main className={`h-screen w-full flex flex-col md:flex-row overflow-hidden transition-colors duration-700 ${theme.bg}`}>
      
      {/* Toast Notification */}
      <Toast message={toastMsg} theme={theme} />

      {/* --- Left: Video Section --- */}
      <section className="relative flex flex-col bg-black/95 overflow-hidden shrink-0 transition-all duration-100" style={{ width: `calc(${leftPanelWidth}%)` }}>
        <style jsx>{`@media (max-width: 768px) { section { width: 100% !important; height: 40vh; } }`}</style>
        <div className="w-full h-full flex items-center justify-center p-4 md:p-8 bg-[#0a0a0a]">
           <div className={`relative w-full aspect-video shadow-[0_0_80px_rgba(0,0,0,0.6)] border-[1px] rounded-[1px] overflow-hidden bg-black group ${currentThemeKey === 'daily' ? 'border-[#333]' : 'border-[#222]'}`}>
             <video ref={videoRef} src={VIDEO_SRC} className="w-full h-full object-cover opacity-90" onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)} onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)} onClick={togglePlay} loop playsInline />
             <div className="absolute inset-0 pointer-events-none opacity-[0.06] bg-noise mix-blend-overlay" />
             {/* Controls */}
             <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6">
                <div className="w-full h-1 bg-white/20 mb-4 cursor-pointer hover:h-2 transition-all rounded-full overflow-hidden" onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const pos = (e.clientX - rect.left) / rect.width;
                    if(videoRef.current) videoRef.current.currentTime = pos * duration;
                  }}>
                   <div className={`h-full ${theme.accent}`} style={{ width: `${(currentTime / duration) * 100}%` }} />
                </div>
                <div className="flex justify-between text-white/80">
                   <button onClick={togglePlay}>{isPlaying ? <Pause size={20} fill="currentColor"/> : <Play size={20} fill="currentColor"/>}</button>
                   <span className="font-mono text-xs opacity-70">{Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')}</span>
                </div>
             </div>
             {!isPlaying && (<div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white"><Play size={24} fill="currentColor" className="ml-1"/></div></div>)}
           </div>
        </div>
      </section>

      {/* Resizer */}
      <div className="hidden md:flex w-1 bg-black/5 hover:bg-black/20 cursor-col-resize z-20 items-center justify-center relative group transition-colors" onMouseDown={startDrag}>
        <div className={`w-[1px] h-8 bg-black/30 group-hover:bg-black/80 transition-all ${isDragging ? 'h-full bg-black' : ''}`} />
      </div>

      {/* --- Right: Laboratory (Modules) --- */}
      <section className={`flex-1 flex flex-col relative z-10 transition-colors duration-700 ${theme.bg}`}>
        
        {/* Hanging Bookmark */}
        <ThemeBookmark currentTheme={theme} setTheme={(k) => setCurrentThemeKey(k as any)} />

        {/* 优化：Tabs 导航栏
            增加了 `pr-32` (padding-right 8rem)，确保最后一个 Tab 即使滚动到最右边，
            也不会被 absolute 定位的 Bookmark 挡住。
            overflow-x-auto 允许鼠标水平滑动。
        */}
        <div className={`flex items-center gap-2 overflow-x-auto p-3 md:p-4 border-b ${theme.border} no-scrollbar pr-32`}> 
          {[
            { id: "script", label: "Script", icon: Layers },
            { id: "blind", label: "Blind", icon: Headphones }, // Added
            { id: "shadow", label: "Shadow", icon: Mic2 },
            { id: "grammar", label: "Grammar", icon: BookOpen },
            { id: "vocab", label: "Vocab", icon: Sparkles },
            { id: "roleplay", label: "Roleplay", icon: Bot }, // Added
            { id: "trans", label: "Recall", icon: RotateCcw },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-shrink-0 px-3 py-2 md:px-4 rounded-md text-[10px] uppercase tracking-widest transition-all duration-300 flex items-center gap-2 border ${activeTab === tab.id ? `${theme.accent} text-white border-transparent shadow-md` : `border-transparent ${theme.text} opacity-50 hover:bg-black/5 hover:opacity-100`}`}>
              <tab.icon size={12} /> <span className="hidden md:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 p-4 md:p-8 overflow-hidden relative">
           <AnimatePresence mode="wait">
             <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="h-full">
               {activeTab === "script" && <ScriptModule currentTime={currentTime} onSeek={(t:number) => videoRef.current && (videoRef.current.currentTime = t)} settings={{ showEn: true, showCn: true }} theme={theme} onSaveToNotebook={handleSaveToNotebook} />}
               {activeTab === "blind" && <BlindModule theme={theme} playbackSpeed={playbackSpeed} setPlaybackSpeed={setPlaybackSpeed} />}
               {activeTab === "shadow" && <ShadowingModule theme={theme} videoRef={videoRef} />}
               {activeTab === "grammar" && <GrammarModule theme={theme} onSaveToNotebook={handleSaveToNotebook} />}
               {activeTab === "vocab" && <div className={`h-full flex items-center justify-center ${theme.text} opacity-50`}>Vocab Module Placeholder</div>}
               {activeTab === "roleplay" && <RoleplayModule theme={theme} />}
               {activeTab === "trans" && <div className={`h-full flex items-center justify-center ${theme.text} opacity-50`}>Recall Module Placeholder</div>}
             </motion.div>
           </AnimatePresence>
        </div>
      </section>
    </main>
  );
}