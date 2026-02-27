"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Sparkles } from 'lucide-react';

interface WineCurtainProps {
  isVisible: boolean;
  onClose?: () => void;
  message?: string;
  requiredTier?: 'yearly' | 'lifetime';
  currentTier?: 'quarterly' | 'yearly' | 'lifetime' | null;
}

export default function WineCurtain({
  isVisible,
  onClose,
  message,
  requiredTier = 'lifetime',
  currentTier = null
}: WineCurtainProps) {
  
  const getUpgradeText = () => {
    if (requiredTier === 'yearly' && currentTier === 'quarterly') {
      return {
        title: 'Unlock Full Access',
        subtitle: '升级到年度会员',
        description: '解锁 AI 对话功能，每期视频 15 次深度交流',
        cta: '升级到年度会员 ¥299'
      };
    }
    
    return {
      title: 'The Conversation Pauses Here',
      subtitle: '升级赞助人解锁无界对话',
      description: message || '本期视频的对话次数已用完。升级到永久会员，享受无限对话权益',
      cta: '升级到永久会员 ¥999'
    };
  };

  const content = getUpgradeText();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="absolute inset-0 z-50 flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(45, 15, 21, 0.96) 0%, rgba(45, 15, 21, 0.98) 100%)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          }}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30,
              delay: 0.1 
            }}
            className="max-w-md mx-4 p-8 rounded-2xl text-center relative"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            }}
          >
            {/* 装饰性光晕 */}
            <div 
              className="absolute -top-20 -left-20 w-40 h-40 rounded-full opacity-20 blur-3xl"
              style={{
                background: 'radial-gradient(circle, rgba(212, 175, 55, 0.3) 0%, transparent 70%)'
              }}
            />
            <div 
              className="absolute -bottom-20 -right-20 w-40 h-40 rounded-full opacity-20 blur-3xl"
              style={{
                background: 'radial-gradient(circle, rgba(212, 175, 55, 0.3) 0%, transparent 70%)'
              }}
            />

            {/* 锁图标 */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                delay: 0.3, 
                type: "spring",
                stiffness: 200,
                damping: 15
              }}
              className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center relative"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              }}
            >
              <Lock size={32} className="text-white" strokeWidth={1.5} />
              
              {/* 闪烁的星星 */}
              <motion.div
                animate={{ 
                  opacity: [0, 1, 0],
                  scale: [0.8, 1.2, 0.8]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute -top-2 -right-2"
              >
                <Sparkles size={16} className="text-[#D4AF37]" />
              </motion.div>
            </motion.div>

            {/* 标题 */}
            <motion.h3 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-2xl font-serif text-white mb-2 tracking-wide"
              style={{
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)'
              }}
            >
              {content.title}
            </motion.h3>

            {/* 副标题 */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-white/60 text-sm mb-6 leading-relaxed"
            >
              {content.subtitle}
            </motion.p>

            {/* 描述 */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-white/80 text-sm mb-8 leading-relaxed px-4"
            >
              {content.description}
            </motion.p>

            {/* 按钮组 */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex flex-col gap-3"
            >
              {/* 升级按钮 */}
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => window.location.href = '/pricing'}
                className="w-full py-3.5 px-6 rounded-xl text-white font-medium text-sm relative overflow-hidden group"
                style={{
                  background: 'linear-gradient(135deg, #D4AF37 0%, #F4E5B8 50%, #D4AF37 100%)',
                  backgroundSize: '200% 100%',
                  boxShadow: '0 4px 20px rgba(212, 175, 55, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                }}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Sparkles size={16} />
                  {content.cta}
                </span>
                
                {/* 悬停光效 */}
                <motion.div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                  }}
                  animate={{
                    x: ['-100%', '100%']
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'linear'
                  }}
                />
              </motion.button>

              {/* 返回按钮 */}
              {onClose && (
                <button
                  onClick={onClose}
                  className="w-full py-3 px-6 rounded-xl text-white/60 hover:text-white/80 transition-colors text-sm font-medium"
                  style={{
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  返回对话
                </button>
              )}
            </motion.div>

            {/* 底部提示 */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="mt-6 text-white/40 text-xs"
            >
              一次升级，终身受益
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

























