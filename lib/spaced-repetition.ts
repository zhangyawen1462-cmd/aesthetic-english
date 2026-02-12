// ============================================================
// SM-2 间隔重复算法
// ============================================================

export interface ReviewCard {
  id: string;
  interval: number;       // 间隔天数
  easeFactor: number;     // 难度系数 (1.3 - 2.5)
  nextReview: string;     // ISO 日期字符串
  reviewCount: number;
}

/**
 * 计算下一次复习时间（基于 SM-2 算法）
 *
 * @param card  当前卡片状态
 * @param quality 回忆质量 0-5（0=完全忘记，5=完美记忆）
 * @returns 更新后的卡片状态
 */
export function calculateNextReview(
  card: ReviewCard,
  quality: 0 | 1 | 2 | 3 | 4 | 5
): ReviewCard {
  let { interval, easeFactor, reviewCount } = card;

  if (quality >= 3) {
    // 正确回忆
    if (reviewCount === 0) {
      interval = 1;
    } else if (reviewCount === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    reviewCount++;
  } else {
    // 遗忘 → 重置
    reviewCount = 0;
    interval = 1;
  }

  // 更新难度系数
  easeFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  return {
    ...card,
    interval,
    easeFactor,
    nextReview: nextReview.toISOString(),
    reviewCount,
  };
}

/**
 * 创建新的复习卡片
 */
export function createReviewCard(id: string): ReviewCard {
  return {
    id,
    interval: 0,
    easeFactor: 2.5,
    nextReview: new Date().toISOString(),
    reviewCount: 0,
  };
}

/**
 * 判断卡片是否需要复习
 */
export function isDueForReview(card: ReviewCard): boolean {
  return new Date(card.nextReview) <= new Date();
}
