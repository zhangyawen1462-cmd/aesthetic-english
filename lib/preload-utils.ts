/**
 * 预加载工具函数
 * 用于优化关键资源的加载时机
 */

/**
 * 预加载图片
 */
export function preloadImage(src: string, priority: 'high' | 'low' = 'low') {
  if (typeof window === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = src;
  link.fetchPriority = priority;
  document.head.appendChild(link);
}

/**
 * 预加载多张图片
 */
export function preloadImages(srcs: string[], priority: 'high' | 'low' = 'low') {
  srcs.forEach(src => preloadImage(src, priority));
}

/**
 * 预连接到外部域名
 */
export function preconnect(url: string) {
  if (typeof window === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = url;
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
}

/**
 * DNS 预解析
 */
export function dnsPrefetch(url: string) {
  if (typeof window === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'dns-prefetch';
  link.href = url;
  document.head.appendChild(link);
}

/**
 * 预加载 API 数据
 */
export async function prefetchAPI(url: string) {
  if (typeof window === 'undefined') return;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return await response.json();
  } catch (error) {
    console.warn('Prefetch failed:', url, error);
    return null;
  }
}

/**
 * 使用 Intersection Observer 实现懒加载
 */
export function createLazyLoader(
  callback: (entry: IntersectionObserverEntry) => void,
  options?: IntersectionObserverInit
) {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return null;
  }

  return new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        callback(entry);
      }
    });
  }, {
    rootMargin: '50px',
    threshold: 0.01,
    ...options,
  });
}














