"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Mic, Play, RotateCcw, Volume2, StopCircle } from "lucide-react";
import type { TranscriptLine } from "@/data/types";

import type { ThemeConfig } from "@/lib/theme-config";

interface ModuleShadowProps {
  theme: ThemeConfig;
  currentTime: number;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  transcript: TranscriptLine[];
}

export default function ModuleShadow({ theme, currentTime, videoRef, transcript }: ModuleShadowProps) {
  const [recordingId, setRecordingId] = useState<number | null>(null);
  const [audioUrls, setAudioUrls] = useState<{ [key: number]: string }>({});
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [showEmptyState, setShowEmptyState] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 延迟显示空状态，防止闪烁
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (transcript.length === 0) {
      timer = setTimeout(() => setShowEmptyState(true), 200);
    } else {
      setShowEmptyState(false);
    }
    return () => clearTimeout(timer);
  }, [transcript]);

  // 获取浏览器支持的音频格式
  const getSupportedMimeType = () => {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
      'audio/wav'
    ];
    
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return 'audio/webm'; // 默认回退
  };

  // --- 动态配色逻辑 (基于主题 id) ---
  const getThemeStyles = () => {
    const id = theme.id;

    if (id === 'daily') {
      return {
        cardBg: "rgba(93, 64, 55, 0.85)",
        border: "rgba(93, 64, 55, 0.2)",
        text: "#FDFBF7",
        titleColor: "#2D0F15", // plum wine
        activeGlow: "0 0 15px rgba(93, 64, 55, 0.4)",
        recordBtnBg: "#5E3A3A",
        recordBtnText: "#FFFFFF",
      };
    }

    if (id === 'cognitive') {
      return {
        cardBg: "rgba(22, 78, 99, 0.85)",
        border: "rgba(22, 78, 99, 0.2)",
        text: "#F0F9FF",
        titleColor: "#1A2233", // midnight blue
        activeGlow: "0 0 15px rgba(22, 78, 99, 0.4)",
        recordBtnBg: "#164E63",
        recordBtnText: "#FFFFFF",
      };
    }

    // Business 主题 - 使用新的灰粉色配色
    return {
      cardBg: "rgba(74, 44, 50, 0.85)", // 深紫红半透明
      border: "rgba(212, 181, 186, 0.2)", // 灰粉色边框
      text: "#D4B5BA", // 灰粉色文字
      titleColor: "#D4B5BA", // 灰粉色标题
      activeGlow: "0 0 15px rgba(232, 213, 216, 0.3)", // 浅灰粉光晕
      recordBtnBg: "#E8D5D8", // 浅灰粉按钮背景
      recordBtnText: "#2D0F15", // plum wine 文字
    };
  };

  const style = getThemeStyles();

  // 幽灵图层背景组件（在 return 前准备）
  const GhostLayer = () => (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-[0.04] mix-blend-overlay"
        style={{ 
          backgroundImage: `url('/images/module-bg/shadow.jpg')`,
          filter: 'blur(2px) contrast(1.2)'
        }}
      />
    </div>
  );

  // --- 录音逻辑（修复移动端兼容性）---
  const startRecording = async (line: TranscriptLine) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedMimeType();
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
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
    } catch (error) {
      console.error('Recording error:', error);
      alert("Microphone access required. Please enable microphone permissions in your browser settings.");
    }
  };

  const stopRecording = (line: TranscriptLine) => {
    // 清除定时器
    if (recordingTimerRef.current) {
      clearTimeout(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

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

  // 处理录音按钮按下（统一处理鼠标和触摸事件）
  const handleRecordStart = (line: TranscriptLine, e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault(); // 阻止默认行为（文本选择、右键菜单等）
    e.stopPropagation();
    startRecording(line);
  };

  // 处理录音按钮释放（统一处理鼠标和触摸事件）
  const handleRecordStop = (line: TranscriptLine, e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    stopRecording(line);
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

      <GhostLayer />

      <audio ref={audioPlayerRef} className="hidden" />

      {/* 顶部标题 - 仅网页端显示 */}
      <div className="hidden md:block w-full px-8 py-6 z-20 sticky top-0 backdrop-blur-sm">
        <h1 className="font-bold font-serif" style={{ color: style.titleColor, fontSize: '30px' }}>
          Shadowing Studio
        </h1>
      </div>

      {/* 列表流 */}
      <div className="flex-1 w-full max-w-2xl mx-auto overflow-y-auto px-6 pb-40 no-scrollbar pt-8 md:pt-2 space-y-3">

        {transcript.length === 0 && showEmptyState && (
          <div className="flex items-center justify-center h-40 opacity-30 animate-in fade-in duration-500">
            <p className="text-[10px] uppercase tracking-widest">No transcript available</p>
          </div>
        )}

        {transcript.map((line) => {
          const isActive = currentTime >= line.start && currentTime <= line.end;
          const isRecordingThis = recordingId === line.id;
          const hasAudio = !!audioUrls[line.id];
          const isPlayingThis = playingId === line.id;

          return (
            <motion.div
              key={line.id}
              onClick={() => jumpToLine(line.start)}
              initial={false}
              layout
              animate={{
                scale: isRecordingThis ? 1.02 : 1,
              }}
              transition={{ 
                layout: { duration: 0.2, ease: "easeInOut" },
                scale: { duration: 0.2 }
              }}
              className="relative w-full flex items-start justify-between min-h-[72px] px-6 py-4 cursor-pointer group"
              style={{
                backgroundColor: style.cardBg,
                color: style.text,
                borderRadius: '8px',
                border: `1px solid ${style.border}`,
                backdropFilter: 'blur(12px)',
                boxShadow: isRecordingThis ? style.activeGlow : "none",
                opacity: isActive || isRecordingThis ? 1 : 0.7,
              }}
            >

              {/* 左侧：序号 + 英文原文 */}
              <div className="flex-1 flex items-start gap-4 mr-4">
                <span className="text-[10px] font-sans opacity-40 w-4 flex-shrink-0 pt-1">0{line.id}</span>
                <p className="text-[15px] md:text-[17px] font-normal leading-snug tracking-tight font-sans break-words">
                  {line.en}
                </p>
              </div>

              {/* 右侧：控制区 */}
              <div className="flex items-start gap-3 flex-shrink-0 pt-1">

                <div className="text-[9px] uppercase tracking-wider font-bold opacity-0 group-hover:opacity-60 transition-opacity whitespace-nowrap hidden md:block">
                  {isRecordingThis ? "Recording..." : (isActive ? "Listening" : "")}
                </div>

                {/* 录音按钮 */}
                {(!hasAudio || isRecordingThis) && (
                  <motion.button
                    onMouseDown={(e) => handleRecordStart(line, e)}
                    onMouseUp={(e) => handleRecordStop(line, e)}
                    onMouseLeave={(e) => { 
                      e.stopPropagation(); 
                      if (isRecordingThis) stopRecording(line); 
                    }}
                    onTouchStart={(e) => handleRecordStart(line, e)}
                    onTouchEnd={(e) => handleRecordStop(line, e)}
                    onTouchCancel={(e) => {
                      e.stopPropagation();
                      if (isRecordingThis) stopRecording(line);
                    }}
                    onContextMenu={(e) => e.preventDefault()} // 禁用右键菜单
                    whileTap={{ scale: 0.9 }}
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-sm select-none touch-none"
                    style={{
                      backgroundColor: isRecordingThis ? style.recordBtnBg : "rgba(255,255,255,0.1)",
                      color: isRecordingThis ? style.recordBtnText : "currentColor",
                      WebkitTouchCallout: 'none',
                      WebkitUserSelect: 'none',
                    }}
                  >
                    {isRecordingThis ? <StopCircle size={18} /> : <Mic size={18} />}
                  </motion.button>
                )}

                {/* 回放 & 重试 */}
                {hasAudio && !isRecordingThis && (
                  <div className="flex items-center gap-2 animate-in fade-in zoom-in">
                    <button
                      onClick={(e) => { e.stopPropagation(); playMyRecord(line.id); }}
                      className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform shadow-sm"
                    >
                      {isPlayingThis ? <Volume2 size={16} className="animate-pulse" /> : <Play size={16} fill="currentColor" />}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); const newUrls = { ...audioUrls }; delete newUrls[line.id]; setAudioUrls(newUrls); }}
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
