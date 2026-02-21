"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
  // 目前默认为 null（未登录），模拟真实场景
  const [realTier, setRealTier] = useState<MembershipTier>(null);
  const [email, setEmail] = useState<string | undefined>(undefined);
  
  // 2. 开发者覆盖状态（初始为空，不干扰正常逻辑）
  const [devTier, setDevTierState] = useState<MembershipTier>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 3. 从后端获取会员状态的函数（可复用）
  const fetchMembership = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 [MembershipContext] 开始获取会员状态...');
      
      // 🆕 从后端 API 获取会员状态
      const response = await fetch('/api/membership');
      const data = await response.json();
      
      console.log('📦 [MembershipContext] 后端返回数据:', data);
      
      if (data.success && data.data.isAuthenticated) {
        console.log('✅ [MembershipContext] 用户已认证，等级:', data.data.tier);
        setRealTier(data.data.tier as MembershipTier);
        setEmail(data.data.email);
      } else {
        console.log('❌ [MembershipContext] 用户未认证');
        // 未登录或未激活，保持 null
        setRealTier(null);
        setEmail(undefined);
      }
    } catch (error) {
      console.error('❌ [MembershipContext] 获取会员状态失败:', error);
      // 出错时保持 null
      setRealTier(null);
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
  const effectiveTier = (process.env.NODE_ENV === 'development' && devTier) 
    ? devTier 
    : realTier;

  return (
    <MembershipContext.Provider value={{ 
      tier: effectiveTier, 
      realTier, 
      devTier, 
      setDevTier,
      refreshMembership: fetchMembership, // 🆕 暴露刷新函数
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


