// ============================================================
// Aesthetic English — 统一动画配置
// ============================================================

export const ANIMATION_CONFIG = {
  /** 缓动曲线 */
  easing: {
    smooth: [0.16, 1, 0.3, 1] as [number, number, number, number],
    bounce: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
  },

  /** Spring 参数 */
  spring: {
    slow: { stiffness: 200, damping: 35 },
    medium: { stiffness: 300, damping: 30 },
    fast: { stiffness: 400, damping: 25 },
  },

  /** 持续时间（秒） */
  duration: {
    fast: 0.2,
    medium: 0.4,
    slow: 0.8,
    curtain: 1.4,
  },

  /** 页面过渡 */
  pageTransition: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
};
