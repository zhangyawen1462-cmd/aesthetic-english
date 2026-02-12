"use client";

import { useEffect } from "react";

interface KeyboardHandlers {
  onPlayPause?: () => void;
  onSeekForward?: () => void;
  onSeekBackward?: () => void;
  onSpeedUp?: () => void;
  onSpeedDown?: () => void;
  onTabSwitch?: (index: number) => void;
}

/**
 * 键盘快捷键 Hook
 *
 * - 空格：播放/暂停
 * - →：快进 5 秒
 * - ←：快退 5 秒
 * - >（Shift+.）：加速
 * - <（Shift+,）：减速
 * - 1-7：切换 Tab
 */
export function useKeyboardShortcuts(handlers: KeyboardHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 忽略在输入框中的快捷键
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement).isContentEditable) {
        return;
      }

      switch (e.key) {
        case " ":
          e.preventDefault();
          handlers.onPlayPause?.();
          break;
        case "ArrowRight":
          e.preventDefault();
          handlers.onSeekForward?.();
          break;
        case "ArrowLeft":
          e.preventDefault();
          handlers.onSeekBackward?.();
          break;
        case ">":
          handlers.onSpeedUp?.();
          break;
        case "<":
          handlers.onSpeedDown?.();
          break;
        default:
          // 数字键 1-7 切换 Tab
          if (/^[1-7]$/.test(e.key)) {
            handlers.onTabSwitch?.(parseInt(e.key, 10) - 1);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlers]);
}
