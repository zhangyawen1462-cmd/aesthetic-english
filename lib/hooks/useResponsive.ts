"use client";

import { useState, useEffect } from "react";

/**
 * 响应式断点检测 Hook
 * @param breakpoint 断点宽度（默认 768px）
 * @returns 是否为移动端
 */
export function useResponsive(breakpoint: number = 768): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);

  return isMobile;
}
