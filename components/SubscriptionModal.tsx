"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, KeyRound, Sparkles, Search, RotateCcw, ChevronDown, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMembership } from '@/context/MembershipContext';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ==========================================
// 兑换码输入组件
// ==========================================
const RedeemInput = ({ onClose }: { onClose: () => void }) => {
  const { refreshMembership } = useMembership(); // 🆕 获取刷新函数
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
        // 🆕 刷新会员状态
        await refreshMembership();
        setTimeout(() => {
          onClose(); // 关闭弹窗
          window.location.href = '/dashboard'; // 刷新页面
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
        className="flex flex-col items-center gap-4 text-[#F7F8F9]"
      >
        <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
          <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-sm">兑换成功！正在跳转...</p>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-md">
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="输入兑换码"
        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded text-[#F7F8F9] placeholder-[#F7F8F9]/30 text-center uppercase tracking-widest text-sm focus:outline-none focus:border-white/30 transition-colors touch-manipulation"
        disabled={isLoading}
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="输入邮箱"
        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded text-[#F7F8F9] placeholder-[#F7F8F9]/30 text-center text-sm focus:outline-none focus:border-white/30 transition-colors touch-manipulation"
        disabled={isLoading}
      />
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
      <button
        onClick={handleRedeem}
        disabled={isLoading}
        className="w-full py-3 bg-white/10 hover:bg-white/20 active:bg-white/25 text-[#F7F8F9] rounded text-xs uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95 touch-manipulation"
      >
        {isLoading ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            <span>验证中...</span>
          </>
        ) : (
          <>
            <KeyRound size={14} />
            <span>Whisper your Key</span>
          </>
        )}
      </button>
    </div>
  );
};

// ==========================================
// 子组件：单张物理卡片 (处理 3D 翻转与手风琴展开)
// ==========================================
const PlanCard = ({ plan, isFocused, onFocus, isMobile }: any) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);

  const isWine = plan.theme === 'wine';
  const isDark = plan.theme === 'dark';

  // 卡片底色逻辑 - 对应三大主题
  // light = Daily (Paper White #F7F8F9)
  // wine = Business (Plum Wine #2D0F15)
  // dark = Cognitive (Midnight Blue #0A1628)
  const frontBg = isWine ? 'bg-[#2D0F15] text-[#F7F8F9]' : 
                  isDark ? 'bg-[#0A1628] text-[#E8F4F8]' : 
                  'bg-[#F7F8F9] text-[#2D0F15]';
  const backBg = isWine ? 'bg-[#1a0505] text-[#F7F8F9]' : 
                 isDark ? 'bg-[#081220] text-[#E8F4F8]' : 
                 'bg-[#E6E0D4] text-[#2D0F15]';

  return (
    <div 
      className="relative w-full lg:w-1/3 perspective-[1500px]"
      onMouseEnter={isMobile ? undefined : onFocus}
      onClick={(e) => {
        // 点击卡片非文字区域翻转
        if ((e.target as HTMLElement).tagName !== 'BUTTON' && 
            (e.target as HTMLElement).tagName !== 'SPAN' &&
            (e.target as HTMLElement).tagName !== 'P' &&
            (e.target as HTMLElement).tagName !== 'H3' &&
            (e.target as HTMLElement).tagName !== 'H4') {
          setIsFlipped(!isFlipped);
        }
        onFocus();
      }}
    >
      <motion.div
        animate={{ 
          rotateY: isFlipped ? 180 : 0,
          scale: isMobile ? 1 : (isFocused ? 1.02 : 1),
          opacity: isMobile ? 1 : (isFocused ? 1 : 0.85),
        }}
        transition={{ type: "spring", stiffness: 80, damping: 20, mass: 1 }}
        style={{ transformStyle: 'preserve-3d' }}
        className={`relative w-full transition-shadow duration-700 
          ${isMobile ? 'min-h-[180px]' : 'h-full'}
          ${isMobile 
            ? 'shadow-[0_2px_8px_rgba(0,0,0,0.1)]' 
            : (isFocused ? (isWine ? 'shadow-[0_0_50px_rgba(74,29,36,0.5)]' : 'shadow-[0_0_30px_rgba(255,255,255,0.05)]') : 'shadow-none')
          }
        `}
      >
        {/* ================= 正面 (Front Face) ================= */}
        <div 
          style={{ backfaceVisibility: 'hidden' }}
          className={`relative flex flex-col border ${isWine ? 'border-[#F7F8F9]/20' : isDark ? 'border-white/5' : 'border-black/5'} ${frontBg} ${isMobile ? 'p-4' : 'p-6 sm:p-8 md:p-10'}`}
        >
          {/* 顶部标题与价格 */}
          <div className={`text-center ${isMobile ? 'mb-3' : 'mb-4 sm:mb-6'}`}>
            {!isMobile && (
              <span className="text-[8px] sm:text-[9px] uppercase tracking-[0.25em] sm:tracking-[0.3em] opacity-40 block mb-2 sm:mb-3">
                {plan.subtitle}
              </span>
            )}
            <h3 className={`font-sans ${isMobile ? 'text-lg mb-2' : 'text-lg sm:text-xl md:text-2xl mb-3 sm:mb-4'}`}>
              {plan.title}
            </h3>
            <div className={`flex ${isMobile ? 'flex-row items-baseline justify-center gap-3' : 'flex-col items-center gap-1 sm:gap-2'}`}>
              {/* 划线原价 */}
              <div className="flex items-baseline gap-1 opacity-40">
                <span className={`font-light line-through ${isMobile ? 'text-[10px]' : 'text-[10px] sm:text-xs'}`}>¥</span>
                <span className={`font-serif tracking-tighter line-through ${isMobile ? 'text-base' : 'text-base sm:text-lg md:text-xl'}`}>{plan.originalPrice}</span>
              </div>
              {/* 特惠价 */}
              <div className="flex items-baseline gap-1">
                <span className={`font-light opacity-50 ${isMobile ? 'text-xs' : 'text-xs sm:text-sm'}`}>¥</span>
                <span className={`font-serif tracking-tighter ${isMobile ? 'text-3xl' : 'text-3xl sm:text-4xl md:text-5xl'}`}>{plan.price}</span>
              </div>
            </div>
          </div>

          {!isMobile && (
            <div className="text-[10px] sm:text-[10px] md:text-[11px] leading-relaxed opacity-70 text-center mb-6 sm:mb-8 px-2 space-y-1">
              {plan.desc.split('。').filter(Boolean).map((line: string, i: number) => (
                <p key={i}>{line}。</p>
              ))}
            </div>
          )}

          {/* 移动端和网页端都显示 View Privileges */}
          <>
            {/* 方案三：渐进式特权揭示 (Progressive Reveal) */}
            <div 
              className="flex-1 flex flex-col justify-end border-t border-current/10 pt-3 sm:pt-4 cursor-pointer group"
              onMouseEnter={isMobile ? undefined : () => setIsRevealed(true)}
              onMouseLeave={isMobile ? undefined : () => setIsRevealed(false)}
              onClick={(e) => { 
                e.stopPropagation(); 
                e.preventDefault();
                setIsRevealed(!isRevealed); 
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setIsRevealed(!isRevealed);
              }}
            >
              <div className="flex items-center justify-center gap-2 opacity-40 group-hover:opacity-100 transition-opacity pb-2">
                <span className={`uppercase tracking-[0.2em] ${isMobile ? 'text-[9px]' : 'text-[8px] sm:text-[9px]'}`}>View Privileges</span>
                <motion.div animate={{ rotate: isRevealed ? 180 : 0 }}>
                  <ChevronDown size={12} strokeWidth={1} />
                </motion.div>
              </div>

              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: isRevealed ? 'auto' : 0, opacity: isRevealed ? 1 : 0 }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className="overflow-hidden"
              >
                <div className="space-y-3 sm:space-y-4 pt-3 sm:pt-4 pb-4 sm:pb-6">
                  {plan.features.map((f: any, i: number) => (
                    <div key={i} className="flex justify-between items-start gap-3 sm:gap-4">
                      <span className={`leading-relaxed tracking-wide ${isMobile ? 'text-[11px]' : 'text-[10px] sm:text-[11px]'} ${f.status === 'lock' ? 'opacity-30 line-through' : 'opacity-80'}`}>
                        {f.text}
                      </span>
                      <span className={`uppercase tracking-widest opacity-40 whitespace-nowrap pt-1 ${isMobile ? 'text-[8px]' : 'text-[7px] sm:text-[8px]'}`}>
                        {f.status === 'limit' ? 'Limited' : f.status === 'lock' ? 'Locked' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </>


        </div>

        {/* ================= 背面 (Back Face - 礼宾指引) ================= */}
        <div 
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          className={`absolute inset-0 flex flex-col items-center justify-center border border-current/10 ${backBg} ${isMobile ? 'p-4' : 'p-6 sm:p-6 md:p-8'}`}
          onClick={(e) => {
            // 点击非文字区域翻转回正面
            if ((e.target as HTMLElement).tagName !== 'P' && 
                (e.target as HTMLElement).tagName !== 'SPAN') {
              setIsFlipped(false);
            }
          }}
        >
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            {/* 大标题：诚挚邀请 */}
            <h3 className={`font-serif font-bold mb-4 sm:mb-6 ${isMobile ? 'text-xl' : 'text-2xl sm:text-3xl'}`}>
              诚挚邀请
            </h3>
            
            {!isMobile && (
              <p className="text-[9px] sm:text-[9px] md:text-[10px] uppercase tracking-[0.12em] sm:tracking-[0.15em] opacity-60 leading-relaxed mb-4 sm:mb-6 md:mb-8 px-2">
                我们的密钥仅通过主理人沙龙发行<br/>
                为保持私人书房的私密性，暂不开放直接购买
              </p>
            )}
            <div className={`bg-current/5 w-full ${isMobile ? 'p-2.5' : 'p-3 sm:p-3 md:p-4'}`}>
              <p className={`tracking-widest opacity-80 mb-2 ${isMobile ? 'text-[9px]' : 'text-[9px] sm:text-[10px] md:text-[11px]'}`}>Step 1. 前往小红书搜索账号</p>
              <p className={`font-serif font-bold ${isMobile ? 'text-[11px]' : 'text-xs sm:text-xs md:text-[13px]'}`}>@审美英语Aesthetic</p>
            </div>
            <p className={`uppercase tracking-[0.12em] sm:tracking-[0.15em] opacity-60 px-2 ${isMobile ? 'text-[8px] mt-2' : 'text-[9px] sm:text-[9px] md:text-[10px] mt-3 sm:mt-3 md:mt-4'}`}>
              Step 2. 进入小红书店铺获取您的 {plan.period} 密钥
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// ==========================================
// 主组件：订阅弹窗 (处理聚光灯背景)
// ==========================================
export default function SubscriptionModal({ isOpen, onClose }: SubscriptionModalProps) {
  const router = useRouter();
  // 方案二：聚光灯状态 (默认聚焦中间的年度会员，index = 1)
  const [focusedIndex, setFocusedIndex] = useState<number>(1);
  const [showRedeemInput, setShowRedeemInput] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // 检测移动端
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const plans = [
    {
      id: "quarterly",
      title: "季度会员",
      subtitle: "访客席",
      price: "58",
      originalPrice: "98",
      period: "Quarterly",
      desc: "解锁【Daily 美学日常】模块。\n在精选的高审美原声切片中，\n摆脱枯燥背诵，\n重新建立每天听懂地道英语的习惯",
      features: [
        { text: "Daily 日常模块全解锁", status: "full" },
        { text: "认知提升 Cognitive Growth 限1期预览", status: "limit" },
        { text: "商业女性 Business Female 限1期预览", status: "limit" },
        { text: "Gabby AI 缪斯 (仅开场白互动)", status: "limit" },
      ],
      theme: "light", // Daily - Paper White
    },
    {
      id: "yearly",
      title: "年度会员",
      subtitle: "书房住民",
      price: "158",
      originalPrice: "268",
      period: "Annual",
      isRecommended: true,
      desc: "全面解锁【审美 / 认知 / 商业】三大核心语料。\n配合每期 18 次 AI 深度对话与影子跟读，\n完成从「听懂」到「能深度表达」的蜕变。",
      features: [
        { text: "三大核心模块全解锁", status: "full" },
        { text: "导出双语字幕 / 语法精讲 / 词汇", status: "full" },
        { text: "Gabby AI 每期视频 18次 深度对话", status: "limit" },
      ],
      theme: "wine", // Business - Plum Wine
    },
    {
      id: "lifetime",
      title: "永久会员",
      subtitle: "核心赞助人",
      price: "298",
      originalPrice: "498",
      period: "Forever",
      desc: "一次性买断全站持续更新的精品语料库。\n解锁无限次 AI 对话，\n支持源视频、音频与精讲笔记导出，\n构建你的私人英语智库。",
      features: [
        { text: "全站终身全特权解锁", status: "full" },
        { text: "Gabby AI 无限畅聊 + 三种灵魂人格情景化输出", status: "full" },
        { text: "音频 / 双语字幕 / 语法精讲 / 词汇导出", status: "full" },
        { text: "【The Editorial】每月不定期期高定视觉精读专栏", status: "full" },
      ],
      theme: "dark", // Cognitive - Midnight Blue
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-12 safe-top safe-bottom">
          {/* 深酒红极暗背景 - 配合聚光灯效果 - 点击背景关闭 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className={`absolute inset-0 ${isMobile ? 'bg-[#0a0203]/95 backdrop-blur-sm' : 'bg-[#0a0203]/90 backdrop-blur-2xl'}`}
          />

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            className={`relative w-full max-w-6xl max-h-full overflow-y-auto overflow-x-hidden no-scrollbar flex flex-col items-center ${isMobile ? 'py-6' : 'py-10'}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Back to Lobby 按钮 */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = '/dashboard';
              }}
              className="absolute top-4 left-4 md:top-6 md:left-6 text-[8px] md:text-[9px] text-[#F7F8F9]/30 uppercase tracking-[0.3em] hover:text-[#F7F8F9]/60 transition-colors active:text-[#F7F8F9]/80 z-50 pointer-events-auto touch-manipulation"
            >
              Back to Lobby
            </button>
              
            <div className={`text-center text-[#F7F8F9] pointer-events-none px-4 ${isMobile ? 'mb-6 mt-12' : 'mb-12 md:mb-16'}`}>
              {/* 移动端：只显示中文，字体较小，透明度降低 */}
              {isMobile ? (
                <p className="text-sm opacity-50" style={{ fontFamily: "'PingFang SC', sans-serif" }}>
                  美学英语 凭邀入内
                </p>
              ) : (
                <>
                  <h2 className="font-serif font-bold text-2xl md:text-4xl tracking-tight mb-3 drop-shadow-lg leading-tight" style={{ letterSpacing: '-0.04em' }}>
                    Aesthetic English is reserved for Patrons
                  </h2>
                  <p className="text-[9px] md:text-[20px] uppercase tracking-[0.3em] md:tracking-[0.4em] opacity-40">
                    美学英语 凭邀入内
                  </p>
                </>
              )}
            </div>

            {/* 卡片区 */}
            <div className={`flex flex-col lg:flex-row w-full items-center lg:items-stretch ${isMobile ? 'gap-3 px-4' : 'gap-4 sm:gap-6 lg:gap-6 px-4 lg:px-0'}`}>
              {plans.map((plan, idx) => (
                <PlanCard 
                  key={plan.id} 
                  plan={plan} 
                  isFocused={focusedIndex === idx}
                  onFocus={() => setFocusedIndex(idx)}
                  isMobile={isMobile}
                />
              ))}
            </div>

            {/* 底部兑换码通道 */}
            <div className={`text-center px-4 ${isMobile ? 'mt-4' : 'mt-12 md:mt-20'}`}>
              <div className="h-px w-10 bg-white/10 mx-auto mb-6 md:mb-8" />
              
              {!showRedeemInput ? (
                <button
                  onClick={() => setShowRedeemInput(true)}
                  className="text-[8px] md:text-[9px] text-[#F7F8F9]/30 uppercase tracking-[0.3em] hover:text-[#F7F8F9]/60 transition-colors active:text-[#F7F8F9]/80"
                >
                Already hold an invitation?
                </button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                <RedeemInput onClose={onClose} />
                </motion.div>
              )}
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}