"use client";

import { motion } from "framer-motion";
import { Lock, Crown, Sparkles } from "lucide-react";
import Link from "next/link";
import { useMembership } from "@/context/MembershipContext";
import { checkVideoAccess, getTierLabel } from "@/lib/permissions";
import type { VideoSection } from "@/lib/permissions";
import { cn } from "@/lib/utils";

interface ContentGateProps {
  children: React.ReactNode;
  section: VideoSection;
  isSample?: boolean;
  fallbackImage?: string;
  className?: string;
}

/**
 * 权限门禁组件 - The Velvet Rope
 * 
 * 用法：
 * <ContentGate section="business" isSample={false}>
 *   <VideoPlayer />
 * </ContentGate>
 * 
 * 如果权限不足，显示优雅的磨砂玻璃遮罩
 */
export default function ContentGate({
  children,
  section,
  isSample = false,
  fallbackImage,
  className
}: ContentGateProps) {
  const { tier } = useMembership();
  const hasAccess = checkVideoAccess(tier, section, isSample);

  // 如果有权限，直接显示内容
  if (hasAccess) {
    return <>{children}</>;
  }

  // 根据板块决定视觉风格
  const gateConfig = getGateConfig(section);

  return (
    <div className={cn("relative w-full h-full min-h-[400px] overflow-hidden rounded-2xl", className)}>
      {/* 背景图片（如果提供） */}
      {fallbackImage && (
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${fallbackImage})` }}
        />
      )}

      {/* 模糊的内容预览 */}
      <div className="absolute inset-0 blur-md opacity-30 pointer-events-none select-none">
        {children}
      </div>

      {/* 磨砂玻璃遮罩层 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="absolute inset-0 backdrop-blur-xl bg-gradient-to-br from-[#F2EFE5]/95 via-[#F2EFE5]/90 to-[#E8E5DC]/95 flex flex-col items-center justify-center"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 50%, rgba(139, 92, 246, 0.03) 0%, transparent 50%),
            radial-gradient(circle at 80% 50%, rgba(245, 158, 11, 0.03) 0%, transparent 50%)
          `
        }}
      >
        {/* 噪点纹理 */}
        <div 
          className="absolute inset-0 opacity-[0.015] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
            backgroundSize: '128px 128px'
          }}
        />

        {/* 呼吸动画的锁图标 */}
        <motion.div
          animate={{
            scale: [1, 1.08, 1],
            opacity: [0.9, 1, 0.9]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="relative z-10 mb-8"
        >
          <div className={cn(
            "w-24 h-24 rounded-full flex items-center justify-center",
            "bg-gradient-to-br shadow-2xl",
            gateConfig.iconBg
          )}>
            <gateConfig.icon 
              size={40} 
              className={gateConfig.iconColor}
              strokeWidth={1.5}
            />
          </div>
        </motion.div>

        {/* 文案区域 */}
        <div className="relative z-10 max-w-md px-6 text-center">
          <h3 className="text-3xl font-serif mb-3 text-[#4A4A4A] tracking-wide">
            {gateConfig.title}
          </h3>
          <p className="text-base text-[#6B6B6B] mb-8 leading-relaxed">
            {gateConfig.description}
          </p>

          {/* 升级按钮 */}
          <Link href="/subscribe">
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "px-10 py-4 rounded-full font-medium text-white",
                "flex items-center gap-3 mx-auto",
                "shadow-lg hover:shadow-xl transition-shadow",
                gateConfig.buttonBg
              )}
            >
              <Sparkles size={18} strokeWidth={2} />
              <span className="text-base">{gateConfig.buttonText}</span>
            </motion.button>
          </Link>

          {/* 当前会员状态 */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xs text-[#999] mt-6 font-mono"
          >
            当前身份：{getTierLabel(tier) || '访客'}
          </motion.p>
        </div>

        {/* 装饰性光晕 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-radial from-white/20 to-transparent blur-3xl pointer-events-none" />
      </motion.div>
    </div>
  );
}

// --- 配置函数 ---

function getGateConfig(section: VideoSection) {
  switch (section) {
    case 'business':
      return {
        icon: Crown,
        iconBg: "from-amber-100 to-yellow-50 border border-amber-200/50",
        iconColor: "text-amber-600",
        title: "Business English",
        description: "商务英语课程为年度会员及以上专享。在这里，你将学习职场沟通、商务写作和专业表达。",
        buttonText: "升级至年度会员",
        buttonBg: "bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600"
      };
    
    case 'cognitive':
      return {
        icon: Lock,
        iconBg: "from-purple-100 to-indigo-50 border border-purple-200/50",
        iconColor: "text-purple-600",
        title: "Cognitive Depth",
        description: "认知深度课程探索语言背后的思维方式。季度会员可体验精选内容，完整课程需年度会员。",
        buttonText: "解锁完整课程",
        buttonBg: "bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
      };
    
    case 'daily':
    default:
      return {
        icon: Lock,
        iconBg: "from-blue-100 to-cyan-50 border border-blue-200/50",
        iconColor: "text-blue-600",
        title: "Daily Essentials",
        description: "日常英语课程对所有会员开放。这里是你的英语学习起点。",
        buttonText: "开始学习",
        buttonBg: "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
      };
  }
}
