"use client";

import { motion, AnimatePresence } from "framer-motion";
import { KeyRound, Loader2, X } from "lucide-react";
import Link from "next/link";
import { useMembership } from "@/context/MembershipContext";
import { checkVideoAccess, getTierLabel } from "@/lib/permissions";
import type { VideoSection } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface ContentGateProps {
  children: React.ReactNode;
  section: VideoSection;
  isSample?: boolean | 'freeTrial';
  fallbackImage?: string;
  className?: string;
}

// ==========================================
// 兑换码输入组件
// ==========================================
const RedeemInput = ({ gateConfig, onClose }: { gateConfig: any; onClose: () => void }) => {
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleRedeem = async () => {
    if (!code.trim()) {
      setError('请输入兑换码');
      return;
    }
    if (!email.trim()) {
      setError('请输入邮箱');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim(), email: email.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1500);
      } else {
        setError(data.message || '兑换失败，请检查兑换码');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4"
        style={{ color: gateConfig.text }}
      >
        <div 
          className="w-12 h-12 flex items-center justify-center border"
          style={{
            borderColor: `${gateConfig.text}20`,
            backgroundColor: `${gateConfig.text}10`,
          }}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: gateConfig.text, opacity: 0.6 }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-xs uppercase tracking-[0.2em]" style={{ opacity: 0.6 }}>兑换成功！正在跳转...</p>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-md px-6">
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="输入兑换码"
        className="w-full px-4 py-3 border text-center uppercase tracking-widest text-sm focus:outline-none transition-colors touch-manipulation"
        style={{
          backgroundColor: `${gateConfig.text}05`,
          borderColor: `${gateConfig.text}15`,
          color: gateConfig.text,
        }}
        disabled={isLoading}
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="输入邮箱"
        className="w-full px-4 py-3 border text-center text-sm focus:outline-none transition-colors touch-manipulation"
        style={{
          backgroundColor: `${gateConfig.text}05`,
          borderColor: `${gateConfig.text}15`,
          color: gateConfig.text,
        }}
        disabled={isLoading}
      />
      {error && (
        <p className="text-xs" style={{ color: gateConfig.text, opacity: 0.6 }}>{error}</p>
      )}
      <button
        onClick={handleRedeem}
        disabled={isLoading}
        className="w-full py-3 text-[10px] uppercase tracking-[0.3em] transition-all border disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95 touch-manipulation"
        style={{
          backgroundColor: gateConfig.buttonBg,
          color: gateConfig.buttonText,
          borderColor: gateConfig.buttonBorder,
        }}
      >
        {isLoading ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            <span>验证中...</span>
          </>
        ) : (
          <>
            <KeyRound size={14} strokeWidth={1.5} />
            <span>Whisper your Key</span>
          </>
        )}
      </button>
      
      {/* 返回按钮 */}
      <button
        onClick={onClose}
        className="text-[9px] uppercase tracking-[0.2em] mt-2 transition-opacity hover:opacity-100 active:opacity-100"
        style={{ color: gateConfig.text, opacity: 0.3 }}
      >
        返回
      </button>
    </div>
  );
};

/**
 * 权限门禁组件 - The Private Library
 * 
 * 用法：
 * <ContentGate section="business" isSample={false}>
 *   <VideoPlayer />
 * </ContentGate>
 * 
 * 如果权限不足，显示优雅的纸质明信片遮罩
 */
export default function ContentGate({
  children,
  section,
  isSample = false,
  fallbackImage,
  className
}: ContentGateProps) {
  const { tier } = useMembership();
  
  // 🔍 调试日志：查看传入的参数
  console.log('🚪 ContentGate:', {
    section,
    isSample,
    tier,
  });
  
  const hasAccess = checkVideoAccess(tier, section, isSample);
  
  console.log('🔐 ContentGate Access Check:', {
    hasAccess,
    tier,
    section,
    isSample,
  });
  
  const [showRedeemInput, setShowRedeemInput] = useState(false);

  // 如果有权限，直接显示内容
  if (hasAccess) {
    return <>{children}</>;
  }

  // 根据板块决定视觉风格
  const gateConfig = getGateConfig(section);

  return (
    <div className={cn("relative w-full h-full min-h-[400px] overflow-hidden", className)}>
      {/* 模糊的内容预览 */}
      <div className="absolute inset-0 blur-xl opacity-10 pointer-events-none select-none grayscale">
        {children}
      </div>

      {/* 纸质明信片遮罩层 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        className="absolute inset-0 flex flex-col items-center justify-center px-6"
        style={{
          backgroundColor: gateConfig.bg,
          color: gateConfig.text,
        }}
      >
        <AnimatePresence mode="wait">
          {!showRedeemInput ? (
            <motion.div
              key="main"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center"
            >
              {/* 极简锁图标 */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="mb-8 sm:mb-10"
              >
                <div 
                  className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center border"
                  style={{
                    borderColor: `${gateConfig.text}15`,
                    backgroundColor: `${gateConfig.text}05`,
                  }}
                >
                  <KeyRound 
                    size={28} 
                    strokeWidth={1}
                    style={{ color: gateConfig.text, opacity: 0.3 }}
                  />
                </div>
              </motion.div>

              {/* 文案区域 */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="max-w-md text-center"
              >
                <p 
                  className="text-xs sm:text-sm mb-4 sm:mb-6 px-4 whitespace-pre-line"
                  style={{ 
                    color: gateConfig.text,
                    opacity: 0.7,
                    fontFamily: "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
                    lineHeight: '2.1'  // 行距标准：2.1倍（从1.8再次增加）
                  }}
                >
                  {gateConfig.description}
                </p>

                {/* 升级按钮 */}
                <motion.button
                  onClick={() => setShowRedeemInput(true)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-8 sm:px-10 py-3 sm:py-4 text-[10px] sm:text-[11px] uppercase tracking-[0.3em] font-medium transition-all border active:scale-95 touch-manipulation"
                  style={{
                    backgroundColor: gateConfig.buttonBg,
                    color: gateConfig.buttonText,
                    borderColor: gateConfig.buttonBorder,
                  }}
                >
                  {tier === 'trial' || tier === 'visitor' ? 'Subscribe' : 'Upgrade'}
                </motion.button>

                {/* 当前会员状态 */}
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] mt-6 sm:mt-8"
                  style={{ 
                    color: gateConfig.text,
                    opacity: 0.25
                  }}
                >
                  当前身份 · {getTierLabel(tier) || '访客'}
                </motion.p>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="redeem"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="w-full flex flex-col items-center"
            >
              <RedeemInput gateConfig={gateConfig} onClose={() => setShowRedeemInput(false)} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// --- 配置函数 ---

function getGateConfig(section: VideoSection) {
  switch (section) {
    case 'business':
      return {
        bg: '#2D0F15',           // Plum Wine
        text: '#F7F8F9',         // Paper White
        title: '强者恒强',
        description: '商业聚焦\n分享创业者、高管等精英人士的语言表达和行为逻辑\n季度会员可体验精选\n完整课程需年度会员及以上',
        buttonBg: '#F7F8F9',
        buttonText: '#2D0F15',
        buttonBorder: 'transparent',
        buttonLabel: 'Acquire Invitation',
      };
    
    case 'cognitive':
      return {
        bg: '#0A1628',           // Midnight Blue
        text: '#E8F4F8',         // Ice Blue
        title: '起心动念',
        description: '认知提升\n分享改变你一生的高阶思维\n季度会员可体验精选内容\n完整课程需年度会员及以上',
        buttonBg: '#857861',     // Warm Sand
        buttonText: '#FFFFFF',
        buttonBorder: 'transparent',
        buttonLabel: 'Unlock Full Access',
      };
    
    case 'daily':
    default:
      return {
        bg: '#F7F8F9',           // Paper White
        text: '#2D0F15',         // Plum Wine
        title: 'Daily Essentials',
        description: '日常英语课程对所有会员开放。\n这里是你的英语学习起点。',
        buttonBg: 'transparent',
        buttonText: '#2D0F15',
        buttonBorder: `#2D0F1520`,
        buttonLabel: 'Start Learning',
      };
  }
}
