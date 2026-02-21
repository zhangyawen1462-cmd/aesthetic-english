"use client";

import { useEffect, useState } from 'react';

interface PerformanceMetrics {
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte
}

/**
 * 性能监控组件（仅开发环境显示）
 * 显示关键性能指标
 */
export default function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 只在开发环境启用
    if (process.env.NODE_ENV !== 'development') return;

    // 监听性能指标
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'paint' && entry.name === 'first-contentful-paint') {
          setMetrics(prev => ({ ...prev, fcp: entry.startTime }));
        }
        if (entry.entryType === 'largest-contentful-paint') {
          setMetrics(prev => ({ ...prev, lcp: entry.startTime }));
        }
        if (entry.entryType === 'first-input') {
          setMetrics(prev => ({ ...prev, fid: (entry as any).processingStart - entry.startTime }));
        }
        if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
          setMetrics(prev => ({ ...prev, cls: (prev.cls || 0) + (entry as any).value }));
        }
      }
    });

    try {
      observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] });
    } catch (e) {
      console.log('Performance Observer not supported');
    }

    // 获取 TTFB
    if (performance.timing) {
      const ttfb = performance.timing.responseStart - performance.timing.requestStart;
      setMetrics(prev => ({ ...prev, ttfb }));
    }

    return () => observer.disconnect();
  }, []);

  // 只在开发环境显示
  if (process.env.NODE_ENV !== 'development') return null;

  const getScoreColor = (metric: string, value?: number) => {
    if (!value) return 'text-gray-400';
    
    switch (metric) {
      case 'fcp':
        return value < 1800 ? 'text-green-500' : value < 3000 ? 'text-yellow-500' : 'text-red-500';
      case 'lcp':
        return value < 2500 ? 'text-green-500' : value < 4000 ? 'text-yellow-500' : 'text-red-500';
      case 'fid':
        return value < 100 ? 'text-green-500' : value < 300 ? 'text-yellow-500' : 'text-red-500';
      case 'cls':
        return value < 0.1 ? 'text-green-500' : value < 0.25 ? 'text-yellow-500' : 'text-red-500';
      case 'ttfb':
        return value < 800 ? 'text-green-500' : value < 1800 ? 'text-yellow-500' : 'text-red-500';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <>
      {/* 切换按钮 */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 left-4 z-[9999] w-10 h-10 bg-black/80 text-white rounded-full flex items-center justify-center text-xs font-mono hover:bg-black transition-colors"
        title="性能监控"
      >
        ⚡
      </button>

      {/* 性能面板 */}
      {isVisible && (
        <div className="fixed bottom-16 left-4 z-[9999] bg-black/90 backdrop-blur-md text-white p-4 rounded-lg shadow-2xl font-mono text-xs max-w-xs">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/20">
            <h3 className="font-bold text-sm">⚡ Performance</h3>
            <button
              onClick={() => setIsVisible(false)}
              className="text-white/60 hover:text-white"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-white/60">FCP:</span>
              <span className={getScoreColor('fcp', metrics.fcp)}>
                {metrics.fcp ? `${Math.round(metrics.fcp)}ms` : '—'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-white/60">LCP:</span>
              <span className={getScoreColor('lcp', metrics.lcp)}>
                {metrics.lcp ? `${Math.round(metrics.lcp)}ms` : '—'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-white/60">FID:</span>
              <span className={getScoreColor('fid', metrics.fid)}>
                {metrics.fid ? `${Math.round(metrics.fid)}ms` : '—'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-white/60">CLS:</span>
              <span className={getScoreColor('cls', metrics.cls)}>
                {metrics.cls ? metrics.cls.toFixed(3) : '—'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-white/60">TTFB:</span>
              <span className={getScoreColor('ttfb', metrics.ttfb)}>
                {metrics.ttfb ? `${Math.round(metrics.ttfb)}ms` : '—'}
              </span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-white/20 text-[10px] text-white/40">
            <div className="flex gap-3">
              <span>🟢 Good</span>
              <span>🟡 Needs Improvement</span>
              <span>🔴 Poor</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

