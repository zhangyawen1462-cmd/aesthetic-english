import { useEffect, useState, useRef, RefObject } from 'react';

interface UseIntersectionObserverOptions {
  threshold?: number;
  root?: Element | null;
  rootMargin?: string;
  freezeOnceVisible?: boolean;
}

/**
 * 交叉观察器 Hook - 用于懒加载和视口检测
 * 
 * @example
 * const ref = useRef<HTMLDivElement>(null);
 * const isVisible = useIntersectionObserver(ref, { threshold: 0.1 });
 */
export function useIntersectionObserver(
  elementRef: RefObject<Element | null>,
  {
    threshold = 0,
    root = null,
    rootMargin = '50px',
    freezeOnceVisible = false,
  }: UseIntersectionObserverOptions = {}
): boolean {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // 如果已经可见且设置了冻结，不再观察
    if (freezeOnceVisible && isVisible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold, root, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [elementRef, threshold, root, rootMargin, freezeOnceVisible, isVisible]);

  return isVisible;
}

