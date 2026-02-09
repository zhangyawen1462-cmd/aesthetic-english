"use client";

import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Mic, Play, RotateCcw, Volume2, StopCircle } from "lucide-react";

interface ModuleShadowProps {
  theme: any;
  currentTime: number;
  videoRef: React.RefObject<HTMLVideoElement | null>; 
}

const TRANSCRIPT = [
  { id: 1, start: 0, end: 2.5, en: "Hi Laura, we're the Dallas Cowboys Cheerleaders." },
  { id: 2, start: 2.6, end: 5.5, en: "And welcome to the Cowboys Christmas Extravaganza!" },
  { id: 3, start: 5.6, end: 8.5, en: "We are so excited to have you here today." },
  { id: 4, start: 8.6, end: 12.0, en: "This city is a symphony of secrets after midnight." },
  { id: 5, start: 12.1, end: 15.0, en: "Tell me, what brings you to this side of the velvet rope?" },
  { id: 6, start: 15.1, end: 18.0, en: "Fashion is not just about clothes, it's about attitude." }
];

export default function ModuleShadow({ theme, currentTime, videoRef }: ModuleShadowProps) {
  const [recordingId, setRecordingId] = useState<number | null>(null);
  const [audioUrls, setAudioUrls] = useState<{ [key: number]: string }>({});
  const [playingId, setPlayingId] = useState<number | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // --- 1. 动态配色逻辑 (精准匹配主题) ---
  const getThemeStyles = () => {
    const bg = theme.bg;

    // A. 米色主题 (#FAF9F6) -> 半透明酒红条带 + 酒红录音键
    if (bg === "#FAF9F6" || bg === "#EAE7DC") {
      return {
        cardBg: "rgba(93, 64, 55, 0.85)", // 浓郁酒红玻璃
        border: "rgba(93, 64, 55, 0.2)",
        text: "#FDFBF7", // 浅色文字
        activeGlow: "0 0 15px rgba(93, 64, 55, 0.4)",
        recordBtnBg: "#5E3A3A", // 录音键：酒红
        recordBtnText: "#FFFFFF"
      };
    }
    
    // B. 浅蓝主题 (#E6F2F5) -> 半透明深蓝条带 + 深蓝录音键
    if (bg === "#E6F2F5" || bg === "#F0F4F8") {
      return {
        cardBg: "rgba(22, 78, 99, 0.85)", // 深海蓝玻璃
        border: "rgba(22, 78, 99, 0.2)",
        text: "#F0F9FF", // 浅蓝白文字
        activeGlow: "0 0 15px rgba(22, 78, 99, 0.4)",
        recordBtnBg: "#164E63", // 录音键：深蓝
        recordBtnText: "#FFFFFF"
      };
    }

    // C. 酒红主题 (#2A1B1D) -> 半透明白条带 + 米白录音键
    return {
      cardBg: "rgba(255, 255, 255, 0.08)", // 磨砂白玻璃
      border: "rgba(255, 255, 255, 0.1)",
      text: "#E6DCCA", // 香槟金文字
      activeGlow: "0 0 15px rgba(255, 255, 255, 0.1)",
      recordBtnBg: "#EAE7DC", // 录音键：米白 (反差色)
      recordBtnText: "#2A1B1D" // 按钮上的图标颜色：深色
    };
  };

  const style = getThemeStyles();

  // --- 2. 交互逻辑 ---
  const startRecording = async (line: any) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioUrls(prev => ({ ...prev, [line.id]: audioUrl }));
      };

      mediaRecorder.start();
      setRecordingId(line.id);

      const video = videoRef.current;
      if (video) {
        video.muted = true; 
        video.currentTime = line.start; 
        video.play();
      }
    } catch (err) {
      alert("Microphone access required.");
    }
  };

  const stopRecording = (line: any) => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    setRecordingId(null);
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.muted = false;
      video.currentTime = line.start;
    }
  };

  const playMyRecord = (id: number) => {
    const url = audioUrls[id];
    if (!url) return;
    if (audioPlayerRef.current) {
      audioPlayerRef.current.src = url;
      audioPlayerRef.current.play();
      setPlayingId(id);
      audioPlayerRef.current.onended = () => setPlayingId(null);
    }
  };

  const jumpToLine = (start: number) => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = start;
      video.play();
    }
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col relative overflow-hidden">
      
      <audio ref={audioPlayerRef} className="hidden" />

      {/* 顶部指示 - 极简 */}
      <div className="w-full px-8 py-4 flex justify-between items-center z-20 sticky top-0 backdrop-blur-sm">
        <span className="text-[9px] uppercase tracking-[0.3em] font-bold opacity-30">Shadowing Studio</span>
        <span className="text-[9px] font-serif italic opacity-30">Hold to Dub</span>
      </div>

      {/* 列表流 - 窄间距 */}
      <div className="flex-1 w-full max-w-2xl mx-auto overflow-y-auto px-6 pb-40 no-scrollbar pt-2 space-y-3">
         {TRANSCRIPT.map((line) => {
           const isActive = currentTime >= line.start && currentTime <= line.end;
           const isRecordingThis = recordingId === line.id;
           const hasAudio = !!audioUrls[line.id];
           const isPlayingThis = playingId === line.id;

           return (
             <motion.div
               key={line.id}
               onClick={() => jumpToLine(line.start)}
               initial={{ opacity: 0, y: 10 }}
               animate={{ 
                 opacity: 1, 
                 y: 0,
                 scale: isRecordingThis ? 1.02 : 1, // 录音时微微放大
               }}
               // 样式核心：窄条、半透明、Verdana
               className="relative w-full flex items-center justify-between min-h-[72px] px-6 py-4 cursor-pointer group transition-all duration-300"
               style={{ 
                 backgroundColor: style.cardBg, // ✅ 颜色现在一定正确
                 color: style.text,
                 borderRadius: '8px', 
                 border: `1px solid ${style.border}`,
                 backdropFilter: 'blur(8px)',
                 boxShadow: isRecordingThis ? style.activeGlow : "none",
                 // 未激活时透明度低一点，聚焦时完全不透明
                 opacity: isActive || isRecordingThis ? 1 : 0.85
               }}
             >
               
               {/* 左侧：序号 + 英文原文 (瘦身版) */}
               <div className="flex-1 flex items-center gap-4 mr-4">
                 <span className="text-[10px] font-serif italic opacity-40 w-4">0{line.id}</span>
                 <p className="text-[16px] md:text-[17px] font-normal leading-snug tracking-tight" 
                    style={{ fontFamily: 'Verdana, sans-serif' }}>
                   {line.en}
                 </p>
               </div>

               {/* 右侧：紧凑控制区 */}
               <div className="flex items-center gap-3">
                  
                  {/* 状态指示 */}
                  <div className="text-[9px] uppercase tracking-wider font-bold opacity-0 group-hover:opacity-60 transition-opacity whitespace-nowrap hidden md:block">
                    {isRecordingThis ? "Recording..." : (isActive ? "Listening" : "")}
                  </div>

                  {/* A. 录音按钮 (重点修改) */}
                  {(!hasAudio || isRecordingThis) && (
                    <motion.button
                       onMouseDown={(e) => { e.stopPropagation(); startRecording(line); }}
                       onMouseUp={(e) => { e.stopPropagation(); stopRecording(line); }}
                       onMouseLeave={(e) => { e.stopPropagation(); if(isRecordingThis) stopRecording(line); }}
                       onTouchStart={(e) => { e.stopPropagation(); startRecording(line); }}
                       onTouchEnd={(e) => { e.stopPropagation(); stopRecording(line); }}
                       whileTap={{ scale: 0.9 }}
                       className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-sm`}
                       style={{
                         // ✅ 动态配色：不再是 red-500
                         backgroundColor: isRecordingThis ? style.recordBtnBg : "rgba(255,255,255,0.1)",
                         color: isRecordingThis ? style.recordBtnText : "currentColor",
                       }}
                    >
                      {isRecordingThis ? <StopCircle size={18} /> : <Mic size={18} />}
                    </motion.button>
                  )}

                  {/* B. 回放 & 重试 (已录音状态) */}
                  {hasAudio && !isRecordingThis && (
                    <div className="flex items-center gap-2 animate-in fade-in zoom-in">
                      <button 
                        onClick={(e) => { e.stopPropagation(); playMyRecord(line.id); }}
                        className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform shadow-sm"
                      >
                         {isPlayingThis ? <Volume2 size={16} className="animate-pulse"/> : <Play size={16} fill="currentColor"/>}
                      </button>
                      <button 
                         onClick={(e) => { e.stopPropagation(); const newUrls = {...audioUrls}; delete newUrls[line.id]; setAudioUrls(newUrls); }}
                         className="p-2 opacity-50 hover:opacity-100 transition-opacity"
                         title="Re-record"
                      >
                        <RotateCcw size={14} />
                      </button>
                    </div>
                  )}
               </div>

             </motion.div>
           );
         })}
      </div>
    </div>
  );
}