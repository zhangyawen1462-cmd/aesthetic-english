"use client";

import React, { useState, useRef } from "react";
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

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // --- 动态配色逻辑 (基于主题 id) ---
  const getThemeStyles = () => {
    const id = theme.id;

    if (id === 'daily') {
      return {
        cardBg: "rgba(93, 64, 55, 0.85)",
        border: "rgba(93, 64, 55, 0.2)",
        text: "#FDFBF7",
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
        activeGlow: "0 0 15px rgba(22, 78, 99, 0.4)",
        recordBtnBg: "#164E63",
        recordBtnText: "#FFFFFF",
      };
    }

    return {
      cardBg: "rgba(255, 255, 255, 0.08)",
      border: "rgba(255, 255, 255, 0.1)",
      text: "#E6DCCA",
      activeGlow: "0 0 15px rgba(255, 255, 255, 0.1)",
      recordBtnBg: "#EAE7DC",
      recordBtnText: "#2A1B1D",
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

  // --- 录音逻辑 ---
  const startRecording = async (line: TranscriptLine) => {
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
    } catch {
      alert("Microphone access required.");
    }
  };

  const stopRecording = (line: TranscriptLine) => {
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

      <GhostLayer />

      <audio ref={audioPlayerRef} className="hidden" />

      {/* 顶部指示 - 推荐比例 16:9 横向图（录音界面） */}
      <div className="w-full px-8 py-4 flex justify-between items-center z-20 sticky top-0 backdrop-blur-sm">
        <span className="text-[9px] uppercase tracking-[0.3em] font-bold opacity-30">Shadowing Studio</span>
        <span className="text-[9px] font-serif italic opacity-30">Hold to Dub</span>
      </div>

      {/* 列表流 */}
      <div className="flex-1 w-full max-w-2xl mx-auto overflow-y-auto px-6 pb-40 no-scrollbar pt-2 space-y-3">

        {transcript.length === 0 && (
          <div className="flex items-center justify-center h-40 opacity-30">
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
              initial={{ opacity: 0, y: 10 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: isRecordingThis ? 1.02 : 1,
              }}
              className="relative w-full flex items-center justify-between min-h-[72px] px-6 py-4 cursor-pointer group transition-all duration-300"
              style={{
                backgroundColor: style.cardBg,
                color: style.text,
                borderRadius: '8px',
                border: `1px solid ${style.border}`,
                backdropFilter: 'blur(8px)',
                boxShadow: isRecordingThis ? style.activeGlow : "none",
                opacity: isActive || isRecordingThis ? 1 : 0.85,
              }}
            >

              {/* 左侧：序号 + 英文原文 */}
              <div className="flex-1 flex items-center gap-4 mr-4">
                <span className="text-[10px] font-serif italic opacity-40 w-4">0{line.id}</span>
                <p className="text-[16px] md:text-[17px] font-normal leading-snug tracking-tight"
                  style={{ fontFamily: 'Verdana, sans-serif' }}>
                  {line.en}
                </p>
              </div>

              {/* 右侧：控制区 */}
              <div className="flex items-center gap-3">

                <div className="text-[9px] uppercase tracking-wider font-bold opacity-0 group-hover:opacity-60 transition-opacity whitespace-nowrap hidden md:block">
                  {isRecordingThis ? "Recording..." : (isActive ? "Listening" : "")}
                </div>

                {/* 录音按钮 */}
                {(!hasAudio || isRecordingThis) && (
                  <motion.button
                    onMouseDown={(e) => { e.stopPropagation(); startRecording(line); }}
                    onMouseUp={(e) => { e.stopPropagation(); stopRecording(line); }}
                    onMouseLeave={(e) => { e.stopPropagation(); if (isRecordingThis) stopRecording(line); }}
                    onTouchStart={(e) => { e.stopPropagation(); startRecording(line); }}
                    onTouchEnd={(e) => { e.stopPropagation(); stopRecording(line); }}
                    whileTap={{ scale: 0.9 }}
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-sm"
                    style={{
                      backgroundColor: isRecordingThis ? style.recordBtnBg : "rgba(255,255,255,0.1)",
                      color: isRecordingThis ? style.recordBtnText : "currentColor",
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
