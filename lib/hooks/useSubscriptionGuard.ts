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
  
  // 🔥 关键修复：使用 tier 作为响应式依赖，确保状态同步
  const [currentTier, setCurrentTier] = useState(tier);
  
  // 当 tier 变化时，立即同步到本地状态
  useEffect(() => {
    setCurrentTier(tier);
  }, [tier]);

  // 判断是否为游客或试用用户（需要显示订阅弹窗）
  const isGuest = currentTier === 'visitor' || currentTier === 'trial';

  // 🔍 调试日志 - 仅在开发环境输出
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 [useSubscriptionGuard] 当前状态:', {
        tier,
        currentTier,
        isLoading,
        isGuest,
        shouldShowSubscription
      });
    }
  }, [tier, currentTier, isLoading, isGuest, shouldShowSubscription]);

  /**
   * 处理课程卡片点击
   * 如果是游客或试用用户，阻止跳转并显示订阅弹窗
   */
  const handleCourseClick = (e?: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🖱️ [useSubscriptionGuard] 点击课程:', {
        tier,
        currentTier,
        isGuest,
        isLoading,
        willIntercept: isGuest && !isLoading,
        hasEvent: !!e,
        eventType: e?.type
      });
    }
    
    // 只有游客或试用用户才拦截
    if (isGuest && !isLoading) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      setShouldShowSubscription(true);
      console.log('🚫 [useSubscriptionGuard] 已拦截跳转，当前 tier:', currentTier);
      return false;
    }
    
    console.log('✅ [useSubscriptionGuard] 允许跳转，当前 tier:', currentTier);
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












