// ==============================================================================
// 🏛️ The Constitution (权限宪法)
// ==============================================================================
// 这里是 "Aesthetic English" 的单一真理来源 (Single Source of Truth)。
// 所有组件必须调用此处的函数来判断显示什么内容，严禁在 UI 组件中硬编码逻辑。

// --- 类型定义 ---
export type MembershipTier = 'quarterly' | 'yearly' | 'lifetime' | 'trial' | 'visitor'; // visitor 代表游客（未登录/未激活），trial 代表试用用户（付费试用）
export type VideoSection = 'daily' | 'cognitive' | 'business';

// --- 中英文映射（用于显示） ---
export const TIER_LABELS = {
  quarterly: '季度会员',
  yearly: '年度会员',
  lifetime: '永久会员',
  trial: '试用用户',
  visitor: '游客'
} as const;

/**
 * 核心权限配置对象
 */
export const PERMISSIONS = {
  
  // ============================================================================
  // 1. 视频课程访问逻辑 (Video Access)
  // ============================================================================
  content: {
    /**
     * 检查用户是否可以观看某个视频
     * @param tier 会员等级
     * @param section 视频所属板块
     * @param isSample 是否为 Sample（false=普通 | true=季度会员钩子 | 'freeTrial'=试用用户专享）
     */
    canAccessVideo: (tier: MembershipTier, section: VideoSection, isSample: boolean | 'freeTrial' = false): boolean => {
      // 👑 Lifetime & Yearly: 拥有所有板块的观看权
      if (tier === 'lifetime' || tier === 'yearly') return true;

      // 🎫 Trial (试用用户): freeTrial 课程完全开放，其他课程不能看
      if (tier === 'trial') {
        return isSample === 'freeTrial';
      }

      // 🎫 Quarterly (季度会员):
      if (tier === 'quarterly') {
        // Daily 区: ✅ 全解锁 (轻松看，随便学)
        if (section === 'daily') return true;
        
        // Cognitive 区: ⚠️ 仅限 Sample (这是钩子 - 让他尝到甜头)
        if (section === 'cognitive') return isSample === true;
        
        // Business 区: ⚠️ 仅限 Sample (这是钩子 - 让他尝到甜头)
        if (section === 'business') return isSample === true;
      }

      // 🚫 Visitor (游客): 什么都看不了
      return false;
    },

    /**
     * 检查是否应该显示"钩子"页面（让用户看到但不能完全访问）
     */
    shouldShowTeaser: (tier: MembershipTier, section: VideoSection): boolean => {
      // 季度会员在 Cognitive 和 Business 区看到钩子
      if (tier === 'quarterly') {
        return section === 'cognitive' || section === 'business';
      }
      return false;
    }
  },

  // ============================================================================
  // 2. Gabby AI 语境教练配置 (AI Logic)
  // ============================================================================
  gabby: {
    /**
     * 获取 AI 对话配置
     * 返回完整的配置对象，包含权限、限制、UI 文案等
     * @param tier 会员等级
     * @param isSample 当前课程的 isSample 状态（用于判断试用课程）
     */
    getConfig: (tier: MembershipTier, isSample?: boolean | 'freeTrial') => {
      // 🎁 FreeTrial 课程：试用用户享受完整权益
      if (isSample === 'freeTrial' && tier === 'trial') {
        return {
          canChat: true,
          dailyLimit: Infinity,     // 🔥 试用课程无限对话
          allowPersonas: true,      // ✅ 试用课程可切换人格
          placeholder: "Message Gabby...",
          statusText: "试用课程 · 无限对话",
          badge: "🎁"
        };
      }
      
      switch (tier) {
        case 'lifetime':
          return {
            canChat: true,
            dailyLimit: Infinity,     // 🔥 无限畅聊
            allowPersonas: true,      // ✅ 解锁三种人格 (The Critic / The Flâneur / The Partner)
            placeholder: "Message Gabby...",
            statusText: "无限对话",
            badge: "∞"
          };
        
        case 'yearly':
          return {
            canChat: true,
            dailyLimit: 18,           // ✅ 有限使用 (每期视频 18 次)
            allowPersonas: false,     // ❌ 仅默认人格
            placeholder: "Message Gabby...",
            statusText: "18 次/期",
            badge: "365"
          };
        
        case 'trial':
        case 'quarterly':
        case 'visitor':
        default:
          return {
            canChat: false,           // ❌ 不可用 (只能看开场白)
            dailyLimit: 0,
            allowPersonas: false,
            placeholder: "Subscribe to chat with Gabby...", // 🔒 诱导文案
            statusText: "预览模式",
            badge: null
          };
      }
    },

    /**
     * 检查是否可以切换 AI 人格模式
     * @param tier 会员等级
     * @param isSample 当前课程的 isSample 状态
     */
    canSwitchPersona: (tier: MembershipTier, isSample?: boolean | 'freeTrial'): boolean => {
      // 🎁 FreeTrial 课程：试用用户可以切换人格
      if (isSample === 'freeTrial' && tier === 'trial') return true;
      
      // 只有永久会员可以切换人格
      return tier === 'lifetime';
    }
  },

  // ============================================================================
  // 3. 资产下载权限 (Assets & Downloads)
  // ============================================================================
  assets: {
    /**
     * 导出笔记 (双语字幕/语法精讲/重点词汇)
     * @param tier 会员等级
     * @param isSample 当前课程的 isSample 状态
     */
    canExportNotes: (tier: MembershipTier, isSample?: boolean | 'freeTrial'): boolean => {
      // 🎁 FreeTrial 课程：试用用户可以导出
      if (isSample === 'freeTrial' && tier === 'trial') return true;
      
      // ✅ Yearly & Lifetime 可用
      return tier === 'yearly' || tier === 'lifetime';
    },

    /**
     * 下载原始视频 (4K Raw Video + 音频)
     * @param tier 会员等级
     * @param isSample 当前课程的 isSample 状态
     */
    canDownloadRawVideo: (tier: MembershipTier, isSample?: boolean | 'freeTrial'): boolean => {
      // 🎁 FreeTrial 课程：试用用户可以下载音频
      if (isSample === 'freeTrial' && tier === 'trial') return true;
      
      // 🔥 仅限 Lifetime (尊贵特权)
      return tier === 'lifetime';
    },

    /**
     * 获取下载权限描述（用于 UI 显示）
     */
    getDownloadCapabilities: (tier: MembershipTier) => {
      if (tier === 'lifetime') {
        return {
          notes: true,
          rawVideo: true,
          audio: true,
          description: '原始音频下载 + 导出双语字幕/语法精讲/重点词汇 + 邮件获得 raw video + notebook 收藏导出'
        };
      }
      if (tier === 'yearly') {
        return {
          notes: true,
          rawVideo: false,
          audio: false,
          description: '导出双语字幕/语法精讲/重点词汇'
        };
      }
      return {
        notes: false,
        rawVideo: false,
        audio: false,
        description: '无下载权限'
      };
    }
  }
};

// ==============================================================================
// 🛠️ 快捷 Helper 函数 (方便组件直接调用)
// ==============================================================================

/**
 * 检查当前用户是否有权观看某视频
 */
export function checkVideoAccess(
  tier: MembershipTier, 
  section: VideoSection, 
  isSample: boolean | 'freeTrial' = false
): boolean {
  return PERMISSIONS.content.canAccessVideo(tier, section, isSample);
}

/**
 * 获取 Gabby AI 配置
 */
export function getGabbyConfig(tier: MembershipTier, isSample?: boolean | 'freeTrial') {
  return PERMISSIONS.gabby.getConfig(tier, isSample);
}

/**
 * 检查是否可以导出笔记
 */
export function canExportNotes(tier: MembershipTier, isSample?: boolean | 'freeTrial'): boolean {
  return PERMISSIONS.assets.canExportNotes(tier, isSample);
}

/**
 * 检查是否可以下载原始视频
 */
export function canDownloadRawVideo(tier: MembershipTier, isSample?: boolean | 'freeTrial'): boolean {
  return PERMISSIONS.assets.canDownloadRawVideo(tier, isSample);
}

/**
 * 获取会员等级的中文显示名称
 */
export function getTierLabel(tier: MembershipTier): string {
  return TIER_LABELS[tier as keyof typeof TIER_LABELS] || '访客';
}

/**
 * 获取升级提示文案
 */
export function getUpgradeMessage(
  currentTier: MembershipTier,
  requiredFeature: string
): string {
  if (!currentTier || currentTier === 'quarterly') {
    return `${requiredFeature}需要年度会员或永久会员权限`;
  }
  if (currentTier === 'yearly') {
    return `${requiredFeature}仅限永久会员使用`;
  }
  return '权限不足';
}

/**
 * 检查是否为高级会员（年度或永久）
 */
export function isPremiumMember(tier: MembershipTier): boolean {
  return tier === 'yearly' || tier === 'lifetime';
}

/**
 * 检查是否为永久会员
 */
export function isLifetimeMember(tier: MembershipTier): boolean {
  return tier === 'lifetime';
}

// ==============================================================================
// 📊 会员权益对比表（用于订阅页面）
// ==============================================================================
export const MEMBERSHIP_COMPARISON = {
  trial: {
    label: '试用用户',
    labelEn: 'Trial User',
    price: '¥0',
    duration: '试用期',
    features: {
      daily: {
        access: 'freeTrial',
        description: '⚠️ 仅限 freeTrial 课程 - 完整体验'
      },
      cognitive: {
        access: 'freeTrial',
        description: '⚠️ 仅限 freeTrial 课程 - 完整体验'
      },
      business: {
        access: 'freeTrial',
        description: '⚠️ 仅限 freeTrial 课程 - 完整体验'
      },
      gabby: {
        access: 'freeTrial',
        description: '⚠️ 仅限 freeTrial 课程 - 无限对话 + 切换人格'
      },
      download: {
        notes: 'freeTrial',
        rawVideo: 'freeTrial',
        description: '⚠️ 仅限 freeTrial 课程 - 可导出笔记和下载音频'
      }
    }
  },
  quarterly: {
    label: '季度会员',
    labelEn: 'The Season',
    price: '¥99',
    duration: '3个月',
    features: {
      daily: {
        access: true,
        description: '✅ 全解锁 - 轻松看，随便学'
      },
      cognitive: {
        access: 'limited',
        description: '⚠️ 限制访问 - 只能看精选页面的1期（这是钩子）'
      },
      business: {
        access: false,
        description: '🔒 完全锁定 - 显示磨砂玻璃遮罩（这是墙）'
      },
      gabby: {
        access: false,
        description: '❌ 不可用 - 只能看开场白'
      },
      download: {
        notes: false,
        rawVideo: false,
        description: '❌ 无下载权限'
      }
    }
  },
  yearly: {
    label: '住民',
    labelEn: 'The Resident',
    price: '¥299',
    duration: '12个月',
    features: {
      daily: {
        access: true,
        description: '✅ 全解锁 + 导出双语字幕/语法精讲/重点词汇'
      },
      cognitive: {
        access: true,
        description: '✅ 全解锁 + 导出双语字幕/语法精讲/重点词汇'
      },
      business: {
        access: true,
        description: '✅ 全解锁 + 导出双语字幕/语法精讲/重点词汇'
      },
      gabby: {
        access: 'limited',
        description: '✅ 有限使用 - 每期视频限制对话 18 次'
      },
      download: {
        notes: true,
        rawVideo: false,
        description: '✅ 可导出笔记'
      }
    }
  },
  lifetime: {
    label: '赞助人',
    labelEn: 'The Patron',
    price: '¥999',
    duration: '终身',
    features: {
      daily: {
        access: true,
        description: '🔥 尊享 + 原始音频下载 + 导出双语字幕/语法精讲/重点词汇 + 邮件获得 raw video + notebook 收藏导出'
      },
      cognitive: {
        access: true,
        description: '🔥 尊享 + 原始音频下载 + 导出双语字幕/语法精讲/重点词汇 + 邮件获得 raw video + notebook 收藏导出'
      },
      business: {
        access: true,
        description: '🔥 尊享 + 原始音频下载 + 导出双语字幕/语法精讲/重点词汇 + 邮件获得 raw video + notebook 收藏导出'
      },
      gabby: {
        access: true,
        description: '🔥 无限畅聊 + 三种人格模式'
      },
      download: {
        notes: true,
        rawVideo: true,
        description: '✅ 全部可下载'
      }
    }
  }
};

// ==============================================================================
// 🔄 类型转换工具（兼容旧代码）
// ==============================================================================

/**
 * 将中文会员类型转换为英文
 */
export function convertTierToEnglish(chineseTier: string | null): MembershipTier | null {
  const mapping: Record<string, MembershipTier> = {
    '季度会员': 'quarterly',
    '年度会员': 'yearly',
    '永久会员': 'lifetime'
  };
  return chineseTier ? (mapping[chineseTier] || null) : null;
}

/**
 * 将英文会员类型转换为中文
 */
export function convertTierToChinese(englishTier: MembershipTier): string {
  return getTierLabel(englishTier);
}

