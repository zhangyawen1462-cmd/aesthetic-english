// ============================================================
// 权限系统 - The Constitution
// ============================================================
// 这是整个应用的权限"宪法"
// 所有关于"谁能做什么"的规则都定义在这里
// 修改权限规则时，只需要修改这一个文件

// --- 会员类型定义 ---
export type MembershipTier = '季度会员' | '年度会员' | '永久会员' | null;

// --- 功能权限配置 ---
export const PERMISSIONS = {
  // 课程访问权限
  courses: {
    // Daily (日常) - 所有人全解锁
    daily: {
      canAccess: (tier: MembershipTier) => true,
      canDownload: (tier: MembershipTier) => tier === '永久会员',
      canExportNotes: (tier: MembershipTier) => tier === '年度会员' || tier === '永久会员',
      description: '轻松看，随便学'
    },
    
    // Cognitive (认知) - 季度会员限制访问
    cognitive: {
      canAccess: (tier: MembershipTier) => tier === '年度会员' || tier === '永久会员',
      canDownload: (tier: MembershipTier) => tier === '永久会员',
      canExportNotes: (tier: MembershipTier) => tier === '年度会员' || tier === '永久会员',
      showTeaser: (tier: MembershipTier) => tier === '季度会员', // 季度会员显示钩子页面
      description: '只能看精选页面的1期（这是钩子）'
    },
    
    // Business (商业) - 季度会员完全锁定
    business: {
      canAccess: (tier: MembershipTier) => tier === '年度会员' || tier === '永久会员',
      canDownload: (tier: MembershipTier) => tier === '永久会员',
      canExportNotes: (tier: MembershipTier) => tier === '年度会员' || tier === '永久会员',
      showTeaser: (tier: MembershipTier) => tier === '季度会员', // 季度会员显示磨砂玻璃遮罩
      description: '显示磨砂玻璃遮罩（这是墙）'
    }
  },

  // Gabby (AI 缪斯) 权限
  aiChat: {
    // 季度会员：只能看开场白，不可用
    canAccess: (tier: MembershipTier) => tier === '年度会员' || tier === '永久会员',
    
    // 年度会员：有限使用，每期视频限制对话 15 次
    canSwitchMode: (tier: MembershipTier) => tier === '永久会员',
    
    // 永久会员：无限畅聊 + 三种人格模式
    getLimit: (tier: MembershipTier) => {
      if (tier === '季度会员') return 0; // 不可用
      if (tier === '年度会员') return 15; // 每期视频 15 次
      if (tier === '永久会员') return 999; // 无限
      return 0;
    },
    
    description: '季度会员不可用，年度会员有限使用，永久会员无限畅聊'
  },

  // 下载功能（原始音频下载）
  download: {
    canDownload: (tier: MembershipTier) => tier === '永久会员',
    description: '原始音频下载 + 导出双语字幕/语法精讲/重点词汇 + 邮件获得 raw video + notebook 收藏导出'
  },

  // 笔记导出
  notes: {
    canExport: (tier: MembershipTier) => tier === '年度会员' || tier === '永久会员',
    description: '导出双语字幕/语法精讲/重点词汇'
  }
};

// --- 便捷工具函数 ---

/**
 * 检查用户是否可以访问某个课程分类
 */
export function canAccessCourse(
  category: 'daily' | 'cognitive' | 'business',
  tier: MembershipTier
): boolean {
  return PERMISSIONS.courses[category].canAccess(tier);
}

/**
 * 检查是否应该显示"钩子"页面（让用户看到但不能用）
 */
export function shouldShowTeaser(
  category: 'cognitive' | 'business',
  tier: MembershipTier
): boolean {
  return PERMISSIONS.courses[category].showTeaser(tier);
}

/**
 * 获取用户的会员等级名称（用于显示）
 */
export function getMembershipLabel(tier: MembershipTier): string {
  if (!tier) return '访客';
  return tier;
}

/**
 * 获取升级提示文案
 */
export function getUpgradeMessage(
  currentTier: MembershipTier,
  requiredFeature: string
): string {
  if (!currentTier || currentTier === '季度会员') {
    return `${requiredFeature}需要年度会员或永久会员权限`;
  }
  if (currentTier === '年度会员') {
    return `${requiredFeature}仅限永久会员使用`;
  }
  return '权限不足';
}

/**
 * 检查是否为高级会员（年度或永久）
 */
export function isPremiumMember(tier: MembershipTier): boolean {
  return tier === '年度会员' || tier === '永久会员';
}

/**
 * 检查是否为永久会员
 */
export function isLifetimeMember(tier: MembershipTier): boolean {
  return tier === '永久会员';
}

// --- 会员权益对比表（用于订阅页面） ---
export const MEMBERSHIP_COMPARISON = {
  '季度会员': {
    label: '访客',
    price: '¥99',
    duration: '3个月',
    features: {
      daily: '✅ 全解锁 - 轻松看，随便学',
      cognitive: '⚠️ 限制访问 - 只能看精选页面的1期（这是钩子）',
      business: '🔒 完全锁定 - 显示磨砂玻璃遮罩（这是墙）',
      gabby: '❌ 不可用 - 只能看开场白',
      download: '❌ 不可用',
      notes: '❌ 不可用'
    }
  },
  '年度会员': {
    label: '住民',
    price: '¥299',
    duration: '12个月',
    features: {
      daily: '✅ 全解锁 + 导出双语字幕/语法精讲/重点词汇',
      cognitive: '✅ 全解锁 + 导出双语字幕/语法精讲/重点词汇',
      business: '✅ 全解锁 + 导出双语字幕/语法精讲/重点词汇',
      gabby: '✅ 有限使用 - 每期视频限制对话 15 次',
      download: '❌ 不可用',
      notes: '✅ 可导出'
    }
  },
  '永久会员': {
    label: '赞助人',
    price: '¥999',
    duration: '终身',
    features: {
      daily: '🔥 尊享 + 原始音频下载 + 导出双语字幕/语法精讲/重点词汇 + 邮件获得 raw video + notebook 收藏导出',
      cognitive: '🔥 尊享 + 原始音频下载 + 导出双语字幕/语法精讲/重点词汇 + 邮件获得 raw video + notebook 收藏导出',
      business: '🔥 尊享 + 原始音频下载 + 导出双语字幕/语法精讲/重点词汇 + 邮件获得 raw video + notebook 收藏导出',
      gabby: '🔥 无限畅聊 + 三种人格模式',
      download: '✅ 可下载',
      notes: '✅ 可导出'
    }
  }
};

