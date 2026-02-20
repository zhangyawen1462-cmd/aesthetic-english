"use client";

import React, { useState, useRef } from 'react';
import { Download, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMembership } from '@/context/MembershipContext';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

interface Theme {
  bg?: string;
  text?: string;
  accent?: string;
}

interface ExportAudioButtonProps {
  videoUrl: string;
  audioUrl?: string; // 🆕 预处理的音频 URL（优先使用）
  filename: string;
  lessonId: string;
  className?: string;
  style?: React.CSSProperties;
  iconSize?: number;
  isMobile?: boolean;
  theme?: Theme;
}

export default function ExportAudioButton({ 
  videoUrl,
  audioUrl, // 🆕 预处理的音频 URL
  filename, 
  lessonId,
  className = '',
  style = {},
  iconSize = 16,
  isMobile = false,
  theme
}: ExportAudioButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const ffmpegRef = useRef<FFmpeg | null>(null);
  
  const { tier } = useMembership(); 
  const canExport = tier === 'lifetime'; // 仅永久会员

  // 🆕 如果有预处理的音频，直接下载
  const handleDirectDownload = () => {
    if (!audioUrl) return;
    
    setShowConfirm(false);
    
    // 创建隐藏的 a 标签触发下载
    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = `${filename}.m4a`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const loadFFmpeg = async () => {
    if (ffmpegRef.current) return ffmpegRef.current;
    
    const ffmpeg = new FFmpeg();
    
    ffmpeg.on('log', ({ message }) => {
      console.log(message);
    });
    
    ffmpeg.on('progress', ({ progress: p }) => {
      const percent = Math.round(p * 100);
      setProgress(20 + percent * 0.7); // 20-90%
    });

    setStatusText('加载转换工具...');
    setProgress(5);
    
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    
    ffmpegRef.current = ffmpeg;
    return ffmpeg;
  };

  const handleExport = async () => {
    if (!canExport) return;
    
    setShowConfirm(false);
    setIsExporting(true);
    setProgress(0);
    setStatusText('准备中...');

    try {
      // 1. 加载 FFmpeg
      console.log('开始加载 FFmpeg...');
      const ffmpeg = await loadFFmpeg();
      console.log('FFmpeg 加载完成');
      
      // 2. 通过服务端代理下载视频文件（避免 CORS）
      setStatusText('下载视频...');
      setProgress(10);
      console.log('开始下载视频:', videoUrl);
      
      const proxyResponse = await fetch('/api/extract-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl, filename })
      });
      
      if (!proxyResponse.ok) {
        throw new Error('视频下载失败');
      }
      
      const videoBlob = await proxyResponse.blob();
      const videoData = new Uint8Array(await videoBlob.arrayBuffer());
      console.log('视频下载完成，大小:', videoData.byteLength);
      
      // 3. 写入 FFmpeg 文件系统
      setStatusText('准备转换...');
      setProgress(15);
      console.log('写入文件到 FFmpeg...');
      await ffmpeg.writeFile('input.mp4', videoData);
      console.log('文件写入完成');
      
      // 4. 提取音频 - 直接复制音频流（不重新编码，速度提升100倍）
      setStatusText('提取音频...');
      setProgress(20);
      console.log('开始提取音频（直接复制模式）...');
      
      // 🚀 关键优化：使用 -c:a copy 直接复制音频流，不重新编码
      // 原视频的音频通常已经是 AAC 格式，直接提取即可，速度极快
      await ffmpeg.exec(['-i', 'input.mp4', '-vn', '-c:a', 'copy', 'output.m4a']);
      console.log('音频提取成功（直接复制，无需编码）');
      
      // 5. 读取输出文件
      setStatusText('准备下载...');
      setProgress(95);
      console.log('读取输出文件...');
      
      const data = await ffmpeg.readFile('output.m4a') as Uint8Array;
      const fileExt = 'm4a';
      const mimeType = 'audio/mp4';
      console.log('读取 M4A 文件成功');
      
      console.log('输出文件大小:', data.byteLength);
      
      // 6. 下载文件
      const blob = new Blob([data as BlobPart], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.${fileExt}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      console.log('文件下载完成');
      
      // 7. 清理
      try {
        await ffmpeg.deleteFile('input.mp4');
        await ffmpeg.deleteFile('output.m4a');
        console.log('临时文件清理完成');
      } catch (cleanError) {
        console.log('清理文件时出错（可忽略）:', cleanError);
      }
      
      setProgress(100);
      setStatusText('完成！');
      
    } catch (error) {
      console.error('音频导出失败，详细错误:', error);
      const errorMsg = error instanceof Error ? error.message : '未知错误';
      alert(`音频导出失败：${errorMsg}\n\n请稍后重试或联系客服。`);
      setStatusText('');
    } finally {
      setTimeout(() => {
        setIsExporting(false);
        setProgress(0);
        setStatusText('');
      }, 1000);
    }
  };

  const renderButton = () => {
    if (isMobile) {
      return (
        <button
          onClick={() => setShowConfirm(true)}
          disabled={!canExport || isExporting}
          className={`${className} disabled:opacity-50 transition-all`}
          style={style}
          title={canExport ? '导出音频' : '需要永久会员'}
        >
          {isExporting ? <Loader2 size={iconSize} className="animate-spin" /> : <Download size={iconSize} />}
        </button>
      );
    }

    return (
      <motion.button
        onClick={() => canExport && !isExporting && setShowConfirm(true)}
        whileHover={canExport && !isExporting ? "hover" : undefined}
        initial="initial"
        className={`relative group flex items-center justify-center ${!canExport || isExporting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
        style={{ width: '64px', height: '40px', ...style }}
        title={canExport ? '导出音频' : '需要永久会员'}
      >
        <motion.div
          variants={{
            initial: { height: '24px', opacity: canExport ? 0.3 : 0.15 },
            hover: { height: '32px', opacity: canExport ? 0.5 : 0.2 }
          }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="w-[1.5px] rounded-full"
          style={{ backgroundColor: theme?.text || '#000' }}
        />
        <motion.div
          variants={{ initial: { opacity: 0, x: -5 }, hover: { opacity: 1, x: 0 } }}
          transition={{ duration: 0.2 }}
          className="absolute whitespace-nowrap text-right"
          style={{ right: '3rem' }}
        >
          <span className="text-sm font-bold tracking-wide font-serif" style={{ color: theme?.text || '#000' }}>
            {isExporting ? `${Math.round(progress)}%` : 'Audio Export'}
          </span>
          {isExporting && statusText && (
            <span className="block text-[10px] opacity-60 mt-0.5">
              {statusText}
            </span>
          )}
        </motion.div>
      </motion.button>
    );
  };

  return (
    <div className="relative">
      {renderButton()}
      <AnimatePresence>
        {showConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirm(false)}
              className="fixed inset-0 z-[9998] bg-black/40"
            />
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="absolute right-16 top-0 z-[9999] rounded-sm p-6 border whitespace-nowrap"
              style={{ 
                backgroundColor: theme?.bg || '#F7F8F9', 
                color: theme?.text || '#2D0F15',
                borderColor: `${theme?.text || '#2D0F15'}20`
              }}
            >
              <p className="text-xs opacity-70 mb-4">
                {audioUrl ? (
                  <>
                    导出音频文件？<br/>
                    <span className="text-[10px] opacity-50">✨ 预处理音频，秒速下载</span>
                  </>
                ) : (
                  <>
                    导出为 M4A 音频文件？<br/>
                    <span className="text-[10px] opacity-50">首次使用需加载转换工具（约30MB）</span>
                  </>
                )}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-2 text-[10px] uppercase tracking-widest border transition-colors hover:bg-black/5"
                  style={{ borderColor: `${theme?.text || '#2D0F15'}20` }}
                >
                  取消
                </button>
                <button
                  onClick={audioUrl ? handleDirectDownload : handleExport}
                  className="px-4 py-2 text-[10px] uppercase tracking-widest transition-colors hover:opacity-90 text-white"
                  style={{ backgroundColor: theme?.accent || '#2D0F15' }}
                >
                  {audioUrl ? '⚡ 秒速下载' : '导出 M4A'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function downloadAudio(audioBlob: Blob, filename: string) {
  const url = URL.createObjectURL(audioBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.webm`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

