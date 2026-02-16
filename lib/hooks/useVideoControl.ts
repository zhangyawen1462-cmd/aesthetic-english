"use client";

import { useState, useCallback, useEffect, type RefObject } from "react";

/**
 * 视频控制 Hook — 封装播放/暂停/跳转/倍速逻辑
 */
export function useVideoControl(videoRef: RefObject<HTMLVideoElement | null>) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    
    // 检查视频源是否有效
    if (!videoRef.current.src || videoRef.current.src === '') {
      console.warn('Video source is empty or invalid');
      return;
    }
    
    if (videoRef.current.paused) {
      videoRef.current.play().catch((error) => {
        console.error('Failed to play video:', error);
        setIsPlaying(false);
      });
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [videoRef]);

  const handleSeek = useCallback(
    (time: number) => {
      if (!videoRef.current) return;
      
      // 检查视频源是否有效
      if (!videoRef.current.src || videoRef.current.src === '') {
        console.warn('Video source is empty or invalid');
        return;
      }
      
      videoRef.current.currentTime = time;
      videoRef.current.play().catch((error) => {
        console.error('Failed to play video after seek:', error);
        setIsPlaying(false);
      });
      setIsPlaying(true);
    },
    [videoRef]
  );

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, [videoRef]);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  }, [videoRef]);

  // 同步倍速到 video 元素
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate, videoRef]);

  return {
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    setIsPlaying,
    setPlaybackRate,
    togglePlay,
    handleSeek,
    setCurrentTime,
    handleTimeUpdate,
    handleLoadedMetadata,
  };
}
