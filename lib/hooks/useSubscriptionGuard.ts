import { useState, useEffect } from 'react';
import { useMembership } from '@/context/MembershipContext';

/**
 * Hook: 检查用户是否需要显示订阅引导
 * 
 * 用法：
 * const { shouldShowSubscription, handleCourseClick } = useSubscriptionGuard();
 * 
 * <Link href="/course/daily/001" onClick={(e) => handleCourseClick(e)}>
 */
export function useSubscriptionGuard() {
  const { tier, isLoading } = useMembership();
  const [shouldShowSubscription, setShouldShowSubscription] = useState(false);

  // 判断是否为游客（未登录或未激活会员）
  const isGuest = !tier || tier === null;

  /**
   * 处理课程卡片点击
   * 如果是游客，阻止跳转并显示订阅弹窗
   */
  const handleCourseClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isGuest && !isLoading) {
      e.preventDefault();
      e.stopPropagation();
      setShouldShowSubscription(true);
      return false;
    }
    return true;
  };

  /**
   * 关闭订阅弹窗
   */
  const closeSubscriptionModal = () => {
    setShouldShowSubscription(false);
  };

  return {
    isGuest,
    shouldShowSubscription,
    handleCourseClick,
    closeSubscriptionModal
  };
}







