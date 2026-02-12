"use client";

import { useState, useRef, useCallback, useEffect } from "react";

/**
 * 可拖拽面板 Hook — 封装左右分栏拖拽逻辑
 */
export function useResizablePanel(
  initialWidth: number = 50,
  min: number = 30,
  max: number = 70
) {
  const [leftWidth, setLeftWidth] = useState(initialWidth);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDrag = useCallback(
    (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
      setLeftWidth(Math.min(Math.max(newWidth, min), max));
    },
    [min, max]
  );

  useEffect(() => {
    const stopDrag = () => {
      setIsDragging(false);
      document.body.style.cursor = "default";
      document.body.style.userSelect = "auto";
    };

    const doDrag = (e: MouseEvent) => {
      if (isDragging) handleDrag(e);
    };

    window.addEventListener("mouseup", stopDrag);
    window.addEventListener("mousemove", doDrag);
    return () => {
      window.removeEventListener("mouseup", stopDrag);
      window.removeEventListener("mousemove", doDrag);
    };
  }, [isDragging, handleDrag]);

  return { containerRef, leftWidth, isDragging, setIsDragging };
}
