"use client";

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import type { MembershipTier } from '@/lib/permissions';
import { convertTierToEnglish } from '@/lib/permissions';

interface MembershipContextType {
  tier: MembershipTier;          // 最终生效的等级（UI 只看这个）
  realTier: MembershipTier;      // 数据库里的真实等级（未来从后端获取）
  devTier: MembershipTier;       // 开发者强制覆盖的等级
  setDevTier: (tier: MembershipTier) => void;
  refreshMembership: () => Promise<void>; // 🆕 刷新会员状态
  isLoading: boolean;
  email?: string;                // 用户邮箱（可选）
}

const MembershipContext = createContext<MembershipContextType | undefined>(undefined);

export function MembershipProvider({ children }: { children: ReactNode }) {
  // 1. 真实用户数据（未来从 Supabase/后端 API 获取）
  // 目前默认为 'visitor'（游客），模拟真实场景
  const [realTier, setRealTier] = useState<MembershipTier>('visitor');
  const [email, setEmail] = useState<string | undefined>(undefined);
  
  // 2. 开发者覆盖状态（初始为空，不干扰正常逻辑）
  const [devTier, setDevTierState] = useState<MembershipTier>('visitor');
  const [isLoading, setIsLoading] = useState(true);

  // 🚀 优化 2：缓存时间戳，防止频繁查询（移动端延长缓存）
  const lastFetchTime = useRef<number>(0);
  const CACHE_DURATION = typeof window !== 'undefined' && window.innerWidth < 768 
    ? 300000  // 移动端：5 分钟缓存
    : 60000;  // 桌面端：60 秒缓存

  // 3. 从后端获取会员状态的函数（可复用）
  const fetchMembership = async (forceRefresh = false) => {
    // 🚀 防抖逻辑：如果距离上次查询不到 60 秒，跳过（除非强制刷新）
    const now = Date.now();
    if (!forceRefresh && now - lastFetchTime.current < CACHE_DURATION) {
      console.log('⚡ [MembershipContext] 使用缓存，跳过查询');
      return;
    }

    try {
      setIsLoading(true);
      console.log('🔍 [MembershipContext] 开始获取会员状态...', forceRefresh ? '(强制刷新)' : '');
      
      // 🆕 从后端 API 获取会员状态
      const response = await fetch('/api/membership', {
        // 禁用浏览器缓存，确保获取最新数据
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      const data = await response.json();
      
      console.log('📦 [MembershipContext] 后端返回数据:', data);
      
      // 强制刷新时，立即更新缓存时间戳
      if (forceRefresh) {
        lastFetchTime.current = now;
      } else {
        // 正常查询时也更新时间戳
        lastFetchTime.current = now;
      }
      
      if (data.success && data.data.isAuthenticated) {
        console.log('✅ [MembershipContext] 用户已认证，等级:', data.data.tier);
        
        // 如果是降级模式，显示警告
        if (data.data.fallback) {
          console.warn('⚠️ [MembershipContext] 降级模式：Notion API 暂时不可用');
        }
        
        setRealTier(data.data.tier as MembershipTier);
        setEmail(data.data.email);
      } else {
        console.log('❌ [MembershipContext] 用户未认证', data.data.reason ? `原因: ${data.data.reason}` : '');
        // 未登录或未激活，设置为 visitor（游客）
        setRealTier('visitor');
        setEmail(undefined);
      }
    } catch (error) {
      console.error('❌ [MembershipContext] 获取会员状态失败:', error);
      // 出错时设置为 visitor（游客）
      setRealTier('visitor');
    } finally {
      setIsLoading(false);
    }
  };

  // 4. 初始化：从后端获取真实会员状态
  useEffect(() => {
    fetchMembership();

    // 开发环境：读取 dev_tier_override
    if (process.env.NODE_ENV === 'development') {
      const savedDevTier = localStorage.getItem('dev_tier_override') as MembershipTier;
      if (savedDevTier) {
        setDevTierState(savedDevTier);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 5. 更新 DevTier 的函数
  const setDevTier = (tier: MembershipTier) => {
    setDevTierState(tier);
    if (tier) {
      localStorage.setItem('dev_tier_override', tier);
    } else {
      localStorage.removeItem('dev_tier_override');
    }
  };

  // 6. 核心逻辑：开发环境下，devTier 优先；否则使用 realTier
  const effectiveTier = (process.env.NODE_ENV === 'development' && devTier && devTier !== 'visitor') 
    ? devTier 
    : realTier;

  // 🔍 调试日志 - 显示最终生效的 tier
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🎭 [MembershipContext] Tier 状态:', {
        realTier,
        devTier,
        effectiveTier,
        isDevMode: process.env.NODE_ENV === 'development',
        willUseDevTier: process.env.NODE_ENV === 'development' && devTier && devTier !== 'visitor'
      });
    }
  }, [realTier, devTier, effectiveTier]);

  return (
    <MembershipContext.Provider value={{ 
      tier: effectiveTier, 
      realTier, 
      devTier, 
      setDevTier,
      refreshMembership: () => fetchMembership(true), // 🆕 强制刷新（跳过缓存）
      isLoading,
      email
    }}>
      {children}
    </MembershipContext.Provider>
  );
}

/**
 * Hook: 在任何组件中获取会员状态
 * 
 * 用法：
 * const { tier } = useMembership();
 * const hasAccess = checkVideoAccess(tier, 'business', false);
 */
export function useMembership() {
  const context = useContext(MembershipContext);
  if (context === undefined) {
    throw new Error('useMembership must be used within a MembershipProvider');
  }
  return context;
}


