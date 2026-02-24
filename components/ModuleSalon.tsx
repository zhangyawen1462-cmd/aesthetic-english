"use client";

import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Lock, ChevronDown, Wand2, RefreshCw } from "lucide-react";
import type { SalonData } from "@/data/types";
import type { ThemeConfig } from "@/lib/theme-config";
import { PERMISSIONS, type MembershipTier, getUpgradeMessage } from "@/lib/permissions";
import WineCurtain from "@/components/WineCurtain";
import { useMembership } from "@/context/MembershipContext";

// --- 类型定义 ---
interface ModuleSalonProps {
  theme: ThemeConfig;
  data?: SalonData;
  videoContext: {
    titleCn: string;
    titleEn: string;
    transcript: string;
    vocab: Array<{ word: string; def: string }>;
  };
  videoMood?: string;
  lessonId: string; // 🆕 用于追踪每期视频的对话次数
  isSample?: boolean | 'freeTrial'; // 🆕 课程类型（用于判断试用课程权限）
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  contentCn?: string; // 🆕 中文翻译
  timestamp: Date;
  correction?: string; 
  isBlurred?: boolean;
  isHidden?: boolean; // 🆕 隐藏消息（不在界面显示）
  usedVocab?: string[]; // 🆕 本条消息复用的词汇
}

// --- AI 模式配置 ---
type AIMode = 'professional' | 'arrogant' | 'romantic';

const AI_MODES = {
  professional: {
    name: '靠谱搭档',
    icon: '☕️',
    openingHook: (title: string) => `Train's delayed. Should we grab lunch or wait here?`,
    openingHookCn: (title: string) => `火车晚点了。我们要去吃午饭还是在这等？`
  },
  arrogant: {
    name: '毒舌老友',
    icon: '🥐',
    openingHook: (title: string) => `This place? Overrated. I know a better spot. Coming?`,
    openingHookCn: (title: string) => `这地方？被高估了。我知道更好的地方。来吗？`
  },
  romantic: {
    name: '浪漫旅伴',
    icon: '🥂',
    openingHook: (title: string) => `Wow, this sunset is unreal. Let's grab a drink. What do you want?`,
    openingHookCn: (title: string) => `哇，这日落绝了。我们去喝一杯吧。你想喝什么？`
  }
};

// --- 根据 videoMood 映射到 AI 模式 ---
const getModeFromVideoMood = (mood?: string): AIMode => {
  if (mood === '专业、严谨') return 'professional';
  if (mood === '启发、思辨') return 'romantic';
  return 'professional';
};

export default function ModuleSalon({ theme, data, videoContext, videoMood, lessonId, isSample }: ModuleSalonProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [expandedCorrectionId, setExpandedCorrectionId] = useState<string | null>(null);
  
  // 🆕 AI 模式切换
  const [currentMode, setCurrentMode] = useState<AIMode>(() => getModeFromVideoMood(videoMood));
  const [showModeSelector, setShowModeSelector] = useState(false);
  
  // 🆕 长按显示中文翻译
  const [showTranslation, setShowTranslation] = useState<string | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  
  // 🆕 付费墙状态
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallMessage, setPaywallMessage] = useState('');
  const [paywallRequiredTier, setPaywallRequiredTier] = useState<'yearly' | 'lifetime'>('lifetime');
  
  // 🆕 移动端检测 + 性能优化
  const [isMobile, setIsMobile] = useState(false);
  const [shouldReduceMotion, setShouldReduceMotion] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 🆕 从 Context 获取会员状态
  const { tier: membershipType } = useMembership();

  // 🆕 检测移动端 + 自动禁用复杂动画
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // 🚀 移动端自动禁用复杂动画，提升滚动性能到 60fps
      setShouldReduceMotion(mobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 🆕 使用"宪法"判断权限（单一数据源）
  const gabbyConfig = PERMISSIONS.gabby.getConfig(membershipType, isSample);
  const hasAccess = gabbyConfig.canChat;
  const canSwitchMode = PERMISSIONS.gabby.canSwitchPersona(membershipType, isSample);
  
  // 🆕 对话次数追踪（从后端获取）
  const [chatCount, setChatCount] = useState<number>(0);
  const [dailyLimit, setDailyLimit] = useState<number | typeof Infinity>(gabbyConfig.dailyLimit);

  // 从后端获取对话次数
  useEffect(() => {
    let isMounted = true; // 防御 React 严格模式下的两次挂载
    
    async function fetchChatUsage() {
      if (!hasAccess) return;
      
      try {
        // 🔧 开发环境：传递模拟的会员等级
        const headers: Record<string, string> = {};
        // 🔥 修复：支持局域网 IP（192.168.x.x）
        const isDev = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1' ||
                      window.location.hostname.startsWith('192.168.');
        if (isDev) {
          // 🔥 修复：无条件发送 dev header
          headers['x-dev-tier'] = membershipType || 'lifetime';
          headers['x-dev-secret'] = 'dev-only-secret-12345';
          console.log('🔧 Fetching chat usage with dev tier:', headers['x-dev-tier']);
        }
        
        // 🆕 传递 isSample 参数
        const isSampleParam = isSample === 'freeTrial' ? 'freeTrial' : (isSample ? 'true' : 'false');
        const response = await fetch(`/api/chat-usage/${lessonId}?isSample=${isSampleParam}`, { headers });
        const data = await response.json();
        
        console.log('🎯 Backend returned count:', data.data?.chatCount);
        console.log('📊 Full API response:', data);
        console.log('📊 Backend limit type:', typeof data.data?.limit, data.data?.limit);
        
        if (data.success && isMounted) {
          setChatCount(data.data.chatCount);
          // 🔥 关键修复：确保 Infinity 被正确处理
          const backendLimit = data.data.limit;
          if (backendLimit === Infinity || backendLimit === 'Infinity' || backendLimit === null) {
            setDailyLimit(Infinity);
            console.log('✅ Set dailyLimit to Infinity');
          } else {
            setDailyLimit(Number(backendLimit));
            console.log('✅ Set dailyLimit to:', Number(backendLimit));
          }
        }
      } catch (error) {
        console.error('Failed to fetch chat usage:', error);
      }
    }
    
    fetchChatUsage();
    
    return () => {
      isMounted = false;
    };
  }, [lessonId, hasAccess, membershipType, isSample]);

  // 计算剩余次数
  const remainingChats = dailyLimit === Infinity ? Infinity : Math.max(0, dailyLimit - chatCount);
  const hasReachedLimit = remainingChats === 0;
  
  // 当前模式配置
  const modeConfig = AI_MODES[currentMode];

  // --- 1. 静默开场白：AI 根据视频内容主动打招呼 ---
  useEffect(() => {
    // 只在初次挂载且聊天记录为空时执行
    if (messages.length > 0) return;
    
    const initChat = async () => {
      // 1. 发送隐藏的 [SCENE_START] 消息
      const hiddenMessage: Message = {
        id: "scene-start",
        role: "user",
        content: "[SCENE_START]",
        timestamp: new Date(),
        isHidden: true // 标记为隐藏，不在界面显示
      };
      
      setMessages([hiddenMessage]);
      setIsLoading(true);
      
      // 🆕 所有会员（包括季度）都调用 AI 生成个性化开场白
      try {
        // 2. 调用 AI 生成情景化开场白
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        // 🔥 修复：支持局域网 IP
        const isDev = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1' ||
                      window.location.hostname.startsWith('192.168.');
        if (isDev) {
          // 🔥 修复：无条件发送 dev header
          headers['x-dev-tier'] = membershipType || 'lifetime';
          headers['x-dev-secret'] = 'dev-only-secret-12345';
          console.log('🔧 Dev mode (opening): Sending x-dev-tier header:', headers['x-dev-tier']);
        }
        
        const response = await fetch("/api/ai-chat-secure", {
          method: "POST",
          headers,
          body: JSON.stringify({
            message: "[SCENE_START]", // 特殊标记，让后端知道这是开场白请求
            mode: currentMode,
            lessonId: lessonId,
            videoContext: {
              title: videoContext.titleEn,
              titleCn: videoContext.titleCn,
              transcript: videoContext.transcript,
              vocabulary: videoContext.vocab,
            },
            conversationHistory: [], // 空历史，表示这是第一条消息
          }),
        });

        const data = await response.json();

        if (data.success) {
          // 🔥 验证 AI 回复不为空
          if (!data.reply || !data.reply.trim()) {
            console.error('Opening reply is empty, using fallback');
            throw new Error('Empty opening reply');
          }
          
          // 3. 显示 AI 的开场白
          const openingMessage: Message = {
            id: "opening",
            role: "assistant",
            content: data.reply,
            contentCn: data.replyCn,
            usedVocab: data.used_vocab || [],
            timestamp: new Date(),
          };
          setMessages([hiddenMessage, openingMessage]);
        } else {
          // 失败时使用默认开场白
          console.error('Failed to generate opening:', data.error);
          throw new Error(data.error || 'API returned success: false');
        }
      } catch (error) {
        console.error('Opening generation error:', error);
        // 失败时使用默认开场白
        const fallbackMessage: Message = {
          id: "opening",
          role: "assistant",
          content: modeConfig.openingHook(videoContext.titleEn),
          contentCn: modeConfig.openingHookCn(videoContext.titleCn),
          timestamp: new Date()
        };
        setMessages([hiddenMessage, fallbackMessage]);
      } finally {
        setIsLoading(false);
      }
    };
    
    // 延迟 800ms 后执行，营造自然感
    const timer = setTimeout(initChat, 800);
    return () => clearTimeout(timer);
  }, [videoContext, currentMode, modeConfig, lessonId, membershipType, messages.length]);

  // 自动滚动 - 只在聊天区域内滚动，不影响整个页面
  useEffect(() => {
    if (messagesEndRef.current) {
      // 使用 scrollIntoView 的 block: 'nearest' 选项，避免影响父容器
      messagesEndRef.current.scrollIntoView({ 
        behavior: "smooth",
        block: "nearest", // 关键：只在必要时滚动，不影响父容器
        inline: "nearest"
      });
    }
  }, [messages, isLoading]);

  // 🎯 自动调整输入框高度 - 修复抖动 Bug
  useLayoutEffect(() => {
    if (textareaRef.current) {
      // 1. 使用 0px 替代 auto，避免浏览器强行渲染默认行高造成的布局塌陷
      textareaRef.current.style.height = '0px';
      // 2. 计算实际需要的滚动高度
      const newHeight = Math.min(textareaRef.current.scrollHeight, 96); // 最大 96px (约6行)
      // 3. 赋予新高度
      textareaRef.current.style.height = newHeight + 'px';
    }
  }, [input]);

  // 切换模式
  const handleModeSwitch = (newMode: AIMode) => {
    if (!canSwitchMode) {
      alert(getUpgradeMessage(membershipType, 'AI 模式切换'));
      return;
    }
    setCurrentMode(newMode);
    setShowModeSelector(false);
    // 清空对话，重新开始
    setMessages([]);
  };

  // 🆕 长按显示翻译
  const handleTouchStart = (messageId: string) => {
    console.log('Touch start:', messageId);
    longPressTimer.current = setTimeout(() => {
      console.log('Long press triggered:', messageId);
      setShowTranslation(messageId);
    }, 500); // 长按 500ms 触发
  };

  const handleTouchEnd = () => {
    console.log('Touch end');
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleMouseDown = (messageId: string) => {
    console.log('Mouse down:', messageId);
    longPressTimer.current = setTimeout(() => {
      console.log('Long press triggered (mouse):', messageId);
      setShowTranslation(messageId);
    }, 500);
  };

  const handleMouseUp = () => {
    console.log('Mouse up');
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleMouseLeave = () => {
    console.log('Mouse leave');
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // --- 发送逻辑 ---
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    // 🎯 精简方案：只做状态更新，让 useEffect 自然处理高度
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // --- 季度会员的"模糊回复"逻辑：显示模糊的 AI 气泡 ---
    if (!hasAccess) {
      setTimeout(() => {
        setIsLoading(false);
        // 显示一个模糊的 AI 回复，引导升级
        const blurredMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "That's an interesting perspective. However, in a professional context, we usually prefer to say it differently to emphasize the nuance and maintain clarity...",
          timestamp: new Date(),
          isBlurred: true, // 标记为模糊，显示锁和"升级查看"
        };
        setMessages((prev) => [...prev, blurredMessage]);
      }, 1500);
      return;
    }

    // --- 🆕 后端验证逻辑 ---
    try {
      // 🔧 开发环境：传递模拟的会员等级
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      // 🔥 修复：支持局域网 IP
      const isDev = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1' ||
                    window.location.hostname.startsWith('192.168.');
      if (isDev) {
        // 🔥 修复：无条件发送 dev header，不依赖 membershipType
        headers['x-dev-tier'] = membershipType || 'lifetime'; // 如果没有 membershipType，默认使用 lifetime
        headers['x-dev-secret'] = 'dev-only-secret-12345';
        console.log('🔧 Dev mode: Sending x-dev-tier header:', headers['x-dev-tier']);
      }
      
      const response = await fetch("/api/ai-chat-secure", {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: input.trim(),
          mode: currentMode,
          lessonId: lessonId, // 🆕 传递 lessonId
          videoContext: {
            title: videoContext.titleEn,
            titleCn: videoContext.titleCn,
            transcript: videoContext.transcript,
            vocabulary: videoContext.vocab,
          },
          conversationHistory: messages
            .filter(m => !m.isBlurred)
            .map((m) => ({
              role: m.role,
              content: m.content,
            })),
        }),
      });

      const data = await response.json();

      if (data.success) {
        // 🔥 验证 AI 回复不为空
        if (!data.reply || !data.reply.trim()) {
          console.error('AI returned empty reply:', data);
          throw new Error('AI 返回了空白回复');
        }
        
        // ✅ 成功：更新对话次数
        if (data.remainingChats !== undefined) {
          if (data.remainingChats === null) {
            // 永久会员：无限对话
            setDailyLimit(Infinity);
            setChatCount(0);
          } else {
            // 年度会员：更新计数
            setChatCount(dailyLimit - data.remainingChats);
          }
        }

        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.reply,
          contentCn: data.replyCn,
          usedVocab: data.used_vocab || [],
          timestamp: new Date(),
          correction: data.correction || undefined,
        };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        // ❌ 失败：处理付费墙
        if (data.error === 'paywall_limit_reached') {
          // 🎭 触发深酒红帷幕
          setShowPaywall(true);
          setPaywallMessage(data.message);
          setPaywallRequiredTier('lifetime');
        } else if (data.error === 'paywall_preview') {
          setShowPaywall(true);
          setPaywallMessage(data.message);
          setPaywallRequiredTier('yearly');
        } else if (data.error === 'unauthorized') {
          // 未登录/未激活会员
          alert('请先激活会员');
          window.location.href = '/redeem';
        } else {
          throw new Error(data.message);
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: "I seem to be having trouble connecting. Please try again.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 根据 mood 选择背景
  const getBackgroundStyle = () => {
    return { backgroundColor: theme.background };
  };

  return (
    <div 
      className="w-full h-full flex flex-col relative overflow-hidden"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "PingFang SC", system-ui, sans-serif' }}
      style={getBackgroundStyle()}
    >
      {/* --- Header: Gabby 的名片 --- */}
      <div
        className={`flex items-center justify-between border-b backdrop-blur-md shrink-0 z-20 ${isMobile ? 'px-4 py-4' : 'px-6 py-5'}`}
        style={{ 
          borderColor: `${theme.lineColor}20`,
          backgroundColor: `${theme.background}cc`
        }}
      >
        <div className="flex items-center gap-4">
          <div className={`rounded-full border border-white/10 relative shadow-sm ${isMobile ? 'w-11 h-11' : 'w-12 h-12'}`}>
             <img 
               src="/gabby.png" 
               alt="Gabby" 
               className="w-full h-full object-cover rounded-full"
             />
             <span className={`absolute bottom-0 right-0 bg-green-500 border-2 border-white rounded-full z-10 ${isMobile ? 'w-2.5 h-2.5' : 'w-3 h-3'}`}></span>
          </div>
          <div>
            <h3 className={`font-semibold tracking-wide ${isMobile ? 'text-sm' : 'text-base'}`} style={{ color: theme.text }}>
              Gabby
            </h3>
            <div className="flex items-center gap-2 opacity-60">
               <span className={isMobile ? 'text-xs' : 'text-sm'}>{modeConfig.icon}</span>
               <p className={`uppercase tracking-wider ${isMobile ? 'text-[9px]' : 'text-[10px]'}`}>{modeConfig.name} Mode</p>
            </div>
          </div>
        </div>
        
        {/* 🆕 模式切换按钮 */}
        <div className="relative">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowModeSelector(!showModeSelector)}
            className={`rounded-full hover:bg-white/5 transition-colors ${isMobile ? 'p-1.5' : 'p-2'}`}
            style={{ color: theme.text, opacity: canSwitchMode ? 1 : 0.3 }}
            disabled={!canSwitchMode}
          >
            <RefreshCw size={isMobile ? 14 : 16} />
          </motion.button>

          {/* 模式选择器 */}
          <AnimatePresence>
            {showModeSelector && canSwitchMode && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute right-0 top-full mt-2 rounded-xl border shadow-xl overflow-hidden z-30"
                style={{ 
                  width: isMobile ? '130px' : '150px',
                  backgroundColor: theme.background,
                  borderColor: theme.lineColor
                }}
              >
                {(Object.keys(AI_MODES) as AIMode[]).map((mode) => {
                  const config = AI_MODES[mode];
                  const isActive = mode === currentMode;
                  
                  return (
                    <button
                      key={mode}
                      onClick={() => handleModeSwitch(mode)}
                      className={`w-full text-left hover:bg-white/5 transition-colors border-b last:border-b-0 ${isMobile ? 'px-3 py-2' : 'px-4 py-3'}`}
                      style={{ 
                        borderColor: theme.lineColor,
                        backgroundColor: isActive ? `${theme.accent}10` : 'transparent'
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span className={isMobile ? 'text-xl' : 'text-2xl'}>{config.icon}</span>
                        <div className="flex-1">
                          <div className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'}`} style={{ color: theme.text }}>
                            {config.name}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* --- Chat Area --- */}
      <div className={`flex-1 overflow-y-auto min-h-0 ${isMobile ? 'px-4 py-5 space-y-5 pb-32' : 'px-6 py-6 space-y-6 pb-40'}`} style={{ scrollBehavior: 'smooth' }}>
        <AnimatePresence>
          {messages
            .filter(m => !m.isHidden && m.content !== '[SCENE_START]') // 🆕 过滤隐藏消息
            .map((message) => {
            const isUser = message.role === "user";
            
            return (
              <motion.div
                key={message.id}
                layout
                initial={shouldReduceMotion ? false : { opacity: 0, y: 10, scale: 0.98 }}
                animate={shouldReduceMotion ? false : { opacity: 1, y: 0, scale: 1 }}
                className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[82%] relative ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
                  
                  {/* 消息气泡 */}
                  <div
                    className={`shadow-sm relative overflow-hidden cursor-pointer select-none
                      ${isMobile ? 'px-4 py-3' : 'px-5 py-4'}
                      ${isUser 
                        ? "rounded-2xl rounded-br-md" 
                        : "rounded-2xl rounded-bl-md"
                      }
                    `}
                    style={{
                      backgroundColor: isUser 
                        ? theme.accent 
                        : `${theme.lineColor}15`,
                      color: isUser ? "#ffffff" : theme.text,
                      ...(message.isBlurred ? { minHeight: isMobile ? '70px' : '90px', minWidth: isMobile ? '180px' : '220px' } : {})
                    }}
                    // 🆕 长按事件
                    onTouchStart={() => !isUser && handleTouchStart(message.id)}
                    onTouchEnd={handleTouchEnd}
                    onMouseDown={() => !isUser && handleMouseDown(message.id)}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                    onClick={() => setShowTranslation(null)} // 点击关闭翻译
                  >
                    {message.isBlurred ? (
                      <>
                        <p className={`leading-relaxed blur-sm opacity-50 select-none ${isMobile ? 'text-xs' : 'text-sm'}`}>
                          {message.content}
                        </p>
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/10 backdrop-blur-[2px]">
                           <div className={`rounded-full bg-black/5 mb-1 ${isMobile ? 'p-1.5' : 'p-2'}`}>
                             <Lock size={isMobile ? 12 : 14} style={{ color: theme.text }} />
                           </div>
                           <span className={`font-bold uppercase tracking-widest ${isMobile ? 'text-[8px]' : 'text-[10px]'}`} style={{ color: theme.text }}>
                             升级查看
                           </span>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* 英文内容 */}
                        <p className={`leading-relaxed whitespace-pre-wrap relative z-10 ${isMobile ? 'text-[15px]' : 'text-base'}`}>
                          {message.content}
                        </p>
                        
                        {/* 🆕 词汇标签（仅 AI 消息显示） */}
                        {!isUser && message.usedVocab && message.usedVocab.length > 0 && (
                          <div className={`flex flex-wrap gap-2 border-t ${isMobile ? 'mt-3 pt-3' : 'mt-3 pt-3'}`} style={{ borderColor: `${theme.lineColor}20` }}>
                            {message.usedVocab.map((word, idx) => (
                              <span
                                key={idx}
                                className={`rounded-full font-medium tracking-wide ${isMobile ? 'px-2 py-1 text-[10px]' : 'px-2.5 py-1 text-[10px]'}`}
                                style={{
                                  backgroundColor: `${theme.accent}15`,
                                  color: theme.accent
                                }}
                              >
                                {word}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        {/* 🆕 中文翻译遮罩层（长按显示） */}
                        <AnimatePresence>
                          {!isUser && showTranslation === message.id && message.contentCn && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className={`absolute inset-0 z-20 flex items-center justify-center rounded-2xl backdrop-blur-sm ${isMobile ? 'p-3' : 'p-4'}`}
                              style={{ 
                                backgroundColor: `${theme.accent}e6`, // 主题色 + 90% 透明度
                              }}
                            >
                              <div className="text-center">
                                <p className={`leading-relaxed text-white font-medium ${isMobile ? 'text-sm' : 'text-[15px]'}`}>
                                  {message.contentCn}
                                </p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    )}
                  </div>

                  {/* Better Way 胶囊 */}
                  {!isUser && !message.isBlurred && message.correction && (
                    <div className={isMobile ? 'mt-1.5 ml-1' : 'mt-2 ml-1'}>
                      <motion.button
                        onClick={() => setExpandedCorrectionId(
                          expandedCorrectionId === message.id ? null : message.id
                        )}
                        className={`flex items-center gap-1.5 font-bold uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity ${isMobile ? 'text-[9px]' : 'text-[10px]'}`}
                        style={{ color: theme.accent }}
                      >
                        <Sparkles size={isMobile ? 9 : 10} />
                        Better Way
                        <motion.div
                          animate={{ rotate: expandedCorrectionId === message.id ? 180 : 0 }}
                        >
                           <ChevronDown size={isMobile ? 9 : 10} />
                        </motion.div>
                      </motion.button>

                      <AnimatePresence>
                        {expandedCorrectionId === message.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div 
                              className={`rounded-lg border-l-2 ${isMobile ? 'mt-1.5 p-2 text-xs' : 'mt-2 p-3 text-sm'}`}
                              style={{ 
                                backgroundColor: `${theme.lineColor}10`,
                                borderColor: theme.accent,
                                color: theme.text
                              }}
                            >
                              <p className="opacity-90 leading-snug">{message.correction}</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* 时间戳 + 长按提示 */}
                  <div className={`flex items-center gap-2 ${isUser ? "justify-end mr-1" : "justify-start ml-1"} ${isMobile ? 'mt-1' : 'mt-1.5'}`}>
                    <span 
                      className={`opacity-30 tracking-wide ${isMobile ? 'text-[8px]' : 'text-[9px]'}`}
                      style={{ color: theme.text }}
                    >
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}
                    </span>
                    
                    {/* 🆕 长按提示（所有 AI 消息都显示） */}
                    {!isUser && !message.isBlurred && message.contentCn && showTranslation !== message.id && (
                      <span 
                        className={`opacity-20 tracking-wider ${isMobile ? 'text-[7px]' : 'text-[8px]'}`}
                        style={{ color: theme.text }}
                      >
                        • 长按看中文
                      </span>
                    )}
                  </div>

                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Loading Indicator - 优雅的三点动画 */}
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="flex justify-start"
          >
             <div 
               className={`rounded-2xl rounded-bl-none ${isMobile ? 'px-3 py-2' : 'px-5 py-3'}`}
               style={{ backgroundColor: `${theme.lineColor}15` }}
             >
                <div className="flex gap-1.5">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      className={`rounded-full ${isMobile ? 'w-1 h-1' : 'w-1.5 h-1.5'}`}
                      style={{ backgroundColor: theme.text }}
                      animate={{ 
                        opacity: [0.3, 0.8, 0.3],
                        scale: [1, 1.2, 1]
                      }}
                      transition={{ 
                        duration: 1.2, 
                        repeat: Infinity, 
                        delay: i * 0.2,
                        ease: "easeInOut"
                      }}
                    />
                  ))}
                </div>
             </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* --- Input Area --- */}
      <div
        className={`absolute bottom-0 left-0 right-0 border-t backdrop-blur-xl z-30 ${isMobile ? 'px-4 py-4 pb-5' : 'px-6 py-5'}`}
        style={{ 
          borderColor: `${theme.lineColor}20`,
          backgroundColor: `${theme.background}F5`,
          ...(isMobile ? { paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' } : {})
        }}
      >
        <div className={`${isMobile ? '' : 'max-w-3xl mx-auto'}`}>
        <div
          className={`flex items-end gap-3 rounded-2xl border transition-all duration-300 focus-within:ring-1 focus-within:ring-offset-0 ${isMobile ? 'px-4 py-2.5' : 'px-5 py-3'}`}
          style={{ 
            borderColor: input.trim() ? theme.accent : `${theme.lineColor}40`,
            backgroundColor: `${theme.background}`,
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
          }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              hasAccess 
                ? (hasReachedLimit ? "已达到本期对话次数上限..." : "回复 Gabby...") 
                : "回复 Gabby..."
            } 
            className={`flex-1 bg-transparent outline-none resize-none placeholder-opacity-30 ${isMobile ? 'text-[15px]' : 'text-base'}`}
            style={{ 
              color: theme.text,
              minHeight: isMobile ? '36px' : '42px',
              maxHeight: '120px',
              height: 'auto'
            }}
            rows={1}
            disabled={isLoading || (hasAccess && hasReachedLimit)}
          />
          
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            disabled={!input.trim() || isLoading || (hasAccess && hasReachedLimit)}
            className={`flex-shrink-0 rounded-full flex items-center justify-center transition-all ${isMobile ? 'w-9 h-9' : 'w-10 h-10'}`}
            style={{
              backgroundColor: (input.trim() && !(hasAccess && hasReachedLimit)) ? theme.accent : `${theme.lineColor}20`,
              opacity: (input.trim() && !(hasAccess && hasReachedLimit)) ? 1 : 0.5,
              cursor: (input.trim() && !(hasAccess && hasReachedLimit)) ? 'pointer' : 'default'
            }}
          >
            <Send size={isMobile ? 14 : 16} style={{ color: "#ffffff" }} />
          </motion.button>
        </div>

        {/* 底部提示 */}
        <div className={isMobile ? 'mt-2.5 text-center' : 'mt-3 text-center'}>
            {!hasAccess && (
               <p className={`uppercase tracking-widest opacity-40 ${isMobile ? 'text-[9px]' : 'text-[10px]'}`} style={{ color: theme.text }}>
                 预览模式 升级到{membershipType === 'quarterly' ? '年度' : '永久'}会员解锁完整功能
               </p>
            )}
            {hasAccess && dailyLimit !== Infinity && (
               <p className={`uppercase tracking-widest opacity-40 ${isMobile ? 'text-[9px]' : 'text-[10px]'}`} style={{ color: theme.text }}>
                 {hasReachedLimit 
                   ? `已用完本期 ${dailyLimit} 次对话 升级到永久会员可无限对话` 
                   : `剩余 ${remainingChats}/${dailyLimit} 次对话 永久会员可切换模式`
                 }
               </p>
            )}
            {hasAccess && dailyLimit === Infinity && (
               <p className={`uppercase tracking-widest opacity-40 ${isMobile ? 'text-[9px]' : 'text-[10px]'}`} style={{ color: theme.text }}>
                 AESTHETIC ENGLISH ｜ Beauty and Brains
               </p>
            )}
        </div>
        </div>
      </div>

      {/* 🎭 深酒红帷幕 */}
      <WineCurtain
        isVisible={showPaywall}
        onClose={() => setShowPaywall(false)}
        message={paywallMessage}
        requiredTier={paywallRequiredTier}
        currentTier={membershipType === 'trial' || membershipType === 'visitor' ? null : membershipType}
      />
    </div>
  );
}
