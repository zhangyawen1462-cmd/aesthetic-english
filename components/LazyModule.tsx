"use client";

import { useRef } from 'react';
import { useIntersectionObserver } from '@/lib/hooks/useIntersectionObserver';

interface LazyModuleProps {
  children: React.ReactNode;
  className?: string;
  fallback?: React.ReactNode;
}

/**
 * 懒加载模块容器
 * 只有当元素进入视口时才渲染子组件
 */
export default function LazyModule({ 
  children, 
  className = '',
  fallback = <div className="h-40 flex items-center justify-center opacity-20">
    <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
  </div>
}: LazyModuleProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(ref, {
    threshold: 0.1,
    rootMargin: '100px',
    freezeOnceVisible: true,
  });

  return (
    <div ref={ref} className={className}>
      {isVisible ? children : fallback}
    </div>
  );
}

