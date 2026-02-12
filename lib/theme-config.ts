// ============================================================
// Aesthetic English — 统一主题配置 (Single Source of Truth)
//
// 设计理念：极致克制的 4 色系统
// - 全站只用 4 种颜色
// - 通过排列组合形成 3 种完全不同的氛围
// ============================================================

// 🎨 全局色彩变量（4 种颜色）
export const COLORS = {
  PAPER: '#F7F8F9',     // 明信片白，干净不发黄
  INK: '#2D0F15',       // 纯正酒红（与 landing page 帷幕同色），慵懒优雅
  ABYSS: '#1A2233',     // 低饱和午夜蓝
  MIST: '#EBF0F5',      // 透白浅蓝色
} as const;

export type CategoryKey = 'daily' | 'cognitive' | 'business';

export interface ThemeConfig {
  // 基础色
  id: CategoryKey;
  label: string;
  bg: string;
  sidebar: string;
  text: string;
  sub: string;
  accent: string;

  // 交互色
  highlight: string;
  lineColor: string;
  border: string;

  // 卡片样式（分类页）
  heroLine1: string;
  heroLine2: string;
  vinylDisc: string;
  vinylDiscText: string;
  imgFilter: string;
  headerBg: string;
  epColor: string;
  indexBg: string;
  indexText: string;

  // 面板样式（详情页）
  panel: string;
  cardBg: string;
  cardShadow: string;
  cardRadius: string;
}

export const THEMES: Record<CategoryKey, ThemeConfig> = {
  daily: {
    id: 'daily',
    label: 'Daily Aesthetics',
    heroLine1: 'Daily',
    heroLine2: 'Aesthetic',

    // 🎨 Daily Aesthetic (日常) — 背景 paper，文字 ink
    bg: COLORS.PAPER,
    sidebar: COLORS.PAPER,
    text: COLORS.INK,
    sub: `${COLORS.INK}73`,
    accent: COLORS.INK,

    highlight: `${COLORS.INK}0F`,
    lineColor: `${COLORS.INK}14`,
    border: `${COLORS.INK}1F`,

    vinylDisc: COLORS.INK,
    vinylDiscText: COLORS.PAPER,
    imgFilter: 'saturate(0.85) contrast(1.03) brightness(0.98)',
    headerBg: `${COLORS.PAPER}EB`,
    epColor: COLORS.INK,
    indexBg: `${COLORS.INK}F5`,
    indexText: COLORS.PAPER,

    panel: 'bg-white/60',
    cardBg: 'rgba(247,248,249,0.7)',
    cardShadow: `0 4px 32px ${COLORS.INK}03`,
    cardRadius: '2px',
  },
  cognitive: {
    id: 'cognitive',
    label: 'Cognitive Growth',
    heroLine1: 'Cognitive',
    heroLine2: 'Growth',

    // 🌙 Cognitive Growth (认知) — 背景 mist (浅蓝打底)，文字 abyss (午夜蓝)
    bg: COLORS.MIST,
    sidebar: COLORS.MIST,
    text: COLORS.ABYSS,
    sub: `${COLORS.ABYSS}7A`,
    accent: COLORS.ABYSS,

    highlight: `${COLORS.ABYSS}14`,
    lineColor: `${COLORS.ABYSS}0F`,
    border: `${COLORS.ABYSS}1A`,

    vinylDisc: COLORS.ABYSS,
    vinylDiscText: COLORS.MIST,
    imgFilter: 'saturate(0.75) contrast(1.08) brightness(0.97)',
    headerBg: `${COLORS.MIST}ED`,
    epColor: COLORS.ABYSS,
    indexBg: `${COLORS.ABYSS}F5`,
    indexText: COLORS.MIST,

    panel: 'bg-white/60',
    cardBg: 'rgba(235,240,245,0.7)',
    cardShadow: `0 4px 32px ${COLORS.ABYSS}03`,
    cardRadius: '0px',
  },
  business: {
    id: 'business',
    label: 'Modern Business',
    heroLine1: 'Business',
    heroLine2: 'Elite',

    // 🍷 Business Elite (精英) — 背景 ink，文字 paper
    bg: COLORS.INK,
    sidebar: COLORS.INK,
    text: COLORS.PAPER,
    sub: `${COLORS.PAPER}73`,
    accent: COLORS.PAPER,

    highlight: `${COLORS.PAPER}1A`,
    lineColor: `${COLORS.PAPER}0D`,
    border: `${COLORS.PAPER}14`,

    vinylDisc: COLORS.PAPER,
    vinylDiscText: COLORS.INK,
    imgFilter: 'saturate(0.6) contrast(1.15) sepia(0.08) brightness(0.96)',
    headerBg: `${COLORS.INK}F0`,
    epColor: COLORS.PAPER,
    indexBg: `${COLORS.PAPER}F5`,
    indexText: COLORS.INK,

    panel: 'bg-black/30',
    cardBg: 'rgba(247,248,249,0.03)',
    cardShadow: `0 4px 32px ${COLORS.PAPER}02`,
    cardRadius: '0px',
  },
};

// ============================================================
// 🎨 水彩纸纹理系统 (300g Watercolor Paper)
//
// 关键原则：
// - 粗糙质感：降低 baseFrequency，增加 contrast
// - 水彩纸感：模拟 300g 厚实水彩纸的纤维纹理
// - 混合模式：multiply（纤维）+ overlay（做旧）
// ============================================================

export const PAPER_TEXTURE = {
  /** 第1层：粗糙的水彩纸纤维（300g 厚实质感） */
  fine: `url("data:image/svg+xml,%3Csvg viewBox='0 0 800 800' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='watercolorGrain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='6' seed='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='discrete' tableValues='0 0 0 1 1'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23watercolorGrain)' opacity='0.25'/%3E%3C/svg%3E")`,

  /** 第2层：水彩纸的不规则纹理（粗糙感） */
  aged: `url("data:image/svg+xml,%3Csvg viewBox='0 0 600 600' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='roughTexture'%3E%3CfeTurbulence type='turbulence' baseFrequency='0.015' numOctaves='4' seed='7'/%3E%3CfeDisplacementMap in='SourceGraphic' scale='5'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='linear' slope='1.5'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23roughTexture)' opacity='0.12'/%3E%3C/svg%3E")`,

  /** 第3层：重纹理（需要更强烈质感时使用） */
  grain: `url("data:image/svg+xml,%3Csvg viewBox='0 0 800 800' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='heavyGrain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.45' numOctaves='5' seed='9' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='discrete' tableValues='0 0 1 1 1'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23heavyGrain)' opacity='0.18'/%3E%3C/svg%3E")`,
};

/** 快速获取主题（兼容旧代码中的 ThemeKey 映射） */
export function getThemeByCategory(category: string): ThemeConfig {
  return THEMES[category as CategoryKey] || THEMES.daily;
}
