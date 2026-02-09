"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion"; 
import { Send, Camera, MoreHorizontal, ChevronLeft, Phone, Video, Info } from "lucide-react";

// 模拟 AI 主编的剧本 (基于课程内容的 Roleplay)
const CHAT_SCRIPT = [
  {
    id: 1,
    role: "ai",
    text: "Scarlett here. I'm looking at your draft for the 'Midnight Symphony' piece.",
    delay: 800
  },
  {
    id: 2,
    role: "ai",
    text: "The opening line: 'This city is a symphony of secrets.' \nHonestly, why 'Symphony'? Give me a reason to keep it.",
    delay: 2000,
    options: [
      { label: "It sounds poetic.", reply: "Poetic isn't enough. We need substance." },
      { label: "It implies ordered chaos.", reply: "Exactly. Chaos, but elegant. Good defense." }, // 正解
      { label: "Because it's loud.", reply: "We are selling dreams, not noise. Try again." }
    ]
  },
  {
    id: 3,
    role: "ai",
    text: "Next. The 'Velvet Rope' metaphor. \nIt's a barrier, yes. But what is it REALLY selling?",
    delay: 1500,
    options: [
      { label: "Safety regulations.", reply: "We are not an insurance company, darling." },
      { label: "Exclusivity and Desire.", reply: "Bingo. The barrier creates the want." } // 正解
    ]
  },
  {
    id: 4,
    role: "ai",
    text: "Final check. 'Fashion is not just clothes, it's attitude.' \nTranslate this for the China issue cover line. Make it punchy.",
    delay: 1500,
    options: [
      { label: "时尚不仅仅是衣服...", reply: "Too long. I fell asleep reading that." },
      { label: "风格，即是态度。", reply: "Short. Punchy. Iconic. Print it." } // 正解
    ]
  },
  {
    id: 5,
    role: "ai",
    text: "Not bad. See you at the shoot tomorrow. \nDon't be late.",
    delay: 1000,
    end: true
  }
];

// 接收 theme 参数
interface ModuleSalonProps {
  theme: any;
}

export default function ModuleSalon({ theme }: ModuleSalonProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [step, setStep] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  
  const bottomRef = useRef<HTMLDivElement>(null);

  // 确保 theme 存在，防止报错 (如果父组件没传)
  const safeTheme = theme || { bg: "#F2EFE5", text: "#101211", accent: "#857861" };
  const color = safeTheme.text;
  const bgColor = safeTheme.bg;
  const accent = safeTheme.accent;

  // 自动滚动
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, showOptions]);

  // 启动对话
  useEffect(() => {
    triggerAiMessage(0);
  }, []);

  const triggerAiMessage = (index: number) => {
    if (index >= CHAT_SCRIPT.length) return;
    
    const script = CHAT_SCRIPT[index];
    setIsTyping(true);
    setShowOptions(false);

    // 模拟 AI 打字延迟
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { role: "ai", text: script.text }]);
      
      if (script.options) {
        setShowOptions(true);
      } else if (!script.end) {
        // 如果是纯陈述，自动下一句
        triggerAiMessage(index + 1);
      }
    }, script.delay);
    
    setStep(index);
  };

  const handleUserChoice = (option: any) => {
    // 1. 用户发送
    setMessages(prev => [...prev, { role: "user", text: option.label }]);
    setShowOptions(false);

    // 2. AI 回复评价
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { role: "ai", text: option.reply }]);
      
      // 3. 继续下一题
      setTimeout(() => {
        triggerAiMessage(step + 1);
      }, 1200);
    }, 1000);
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col relative overflow-hidden" style={{ color: color }}>
      
      {/* --- Header: Instagram Direct 风格 --- */}
      <div className="w-full px-4 py-3 border-b flex items-center justify-between z-30 sticky top-0 backdrop-blur-xl"
           style={{ borderColor: `${color}15`, backgroundColor: bgColor + 'CC' }}>
        <div className="flex items-center gap-4">
          <ChevronLeft size={26} strokeWidth={1.5} className="cursor-pointer opacity-70 hover:opacity-100" />
          <div className="flex items-center gap-3">
            {/* 头像 */}
            <div className="w-8 h-8 rounded-full bg-current opacity-10 relative overflow-hidden flex items-center justify-center">
               <span className="text-[10px] font-bold opacity-100">SZ</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-bold leading-none flex items-center gap-1">
                Scarlett Zhang <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block ml-1"/>
              </span>
              <span className="text-[10px] opacity-50 mt-0.5">Editor-in-Chief</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-5 opacity-60">
           <Phone size={22} strokeWidth={1.5} />
           <Video size={24} strokeWidth={1.5} />
           <Info size={22} strokeWidth={1.5} />
        </div>
      </div>

      {/* --- Chat Area --- */}
      <div className="flex-1 w-full max-w-xl mx-auto overflow-y-auto p-4 space-y-6 no-scrollbar">
        {/* 时间戳 */}
        <div className="text-center py-4">
           <span className="text-[10px] font-medium opacity-30 uppercase tracking-widest">Today 12:03 AM</span>
        </div>

        {messages.map((msg, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {/* AI 头像 (小) */}
            {msg.role === "ai" && (
              <div className="w-7 h-7 rounded-full bg-current opacity-10 mr-2 self-end mb-1 shrink-0" />
            )}

            {/* 气泡 */}
            <div 
              className={`px-5 py-3 max-w-[85%] text-[15px] leading-relaxed shadow-sm`}
              style={{
                borderRadius: "22px",
                // AI (Scarlett): 透明空心框 (冷静)
                // User (You): 实心强调色 (态度)
                backgroundColor: msg.role === "user" ? accent : "transparent",
                border: msg.role === "ai" ? `1px solid ${color}30` : "none",
                color: msg.role === "user" ? bgColor : color, // 反转字色
                
                // 气泡尾巴
                borderBottomLeftRadius: msg.role === "ai" ? "4px" : "22px",
                borderBottomRightRadius: msg.role === "user" ? "4px" : "22px",
              }}
            >
              <p style={{ fontFamily: msg.role === "user" ? '"Songti SC", serif' : 'Verdana, sans-serif' }}>
                {msg.text}
              </p>
            </div>
          </motion.div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start w-full pl-9">
              <div className="px-4 py-3 rounded-full rounded-bl-sm border flex gap-1 items-center h-[40px]"
                   style={{ borderColor: `${color}20`, backgroundColor: `${color}05` }}>
                 <div className="w-1.5 h-1.5 rounded-full bg-current opacity-40 animate-bounce" style={{ animationDelay: "0ms" }} />
                 <div className="w-1.5 h-1.5 rounded-full bg-current opacity-40 animate-bounce" style={{ animationDelay: "150ms" }} />
                 <div className="w-1.5 h-1.5 rounded-full bg-current opacity-40 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
           </motion.div>
        )}
        
        <div ref={bottomRef} className="h-4" />
      </div>

      {/* --- Footer: 交互区 --- */}
      <div className="w-full p-4 z-30 sticky bottom-0 backdrop-blur-xl border-t"
           style={{ backgroundColor: bgColor + 'E6', borderColor: `${color}10` }}>
        
        <AnimatePresence mode="wait">
          {showOptions ? (
            /* 1. 选项模式 (预设回答) */
            <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: 10 }}
               className="flex flex-col gap-3"
            >
              <div className="flex items-center justify-center gap-2 opacity-30">
                 <div className="h-[1px] w-8 bg-current"/>
                 <span className="text-[9px] uppercase tracking-widest font-bold">Reply Suggestion</span>
                 <div className="h-[1px] w-8 bg-current"/>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {CHAT_SCRIPT[step]?.options?.map((opt: any, i: number) => (
                  <button
                    key={i}
                    onClick={() => handleUserChoice(opt)}
                    className="px-5 py-3 rounded-full text-sm font-medium transition-all active:scale-95 border hover:bg-current hover:bg-opacity-5"
                    style={{ 
                      borderColor: color, 
                      color: color,
                      fontFamily: '"Songti SC", serif'
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            /* 2. 伪装输入框 (Instagram Style) */
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }}
               className="flex items-center gap-3 px-4 py-3 rounded-full border border-transparent"
               style={{ backgroundColor: `${color}08` }} // 极淡背景
            >
               <div className="w-8 h-8 rounded-full bg-current opacity-100 flex items-center justify-center text-white" 
                    style={{ backgroundColor: accent }}>
                  <Camera size={16} />
               </div>
               <div className="flex-1 text-[15px] opacity-40 font-normal select-none">
                  {isTyping ? "Scarlett is typing..." : "Message..."}
               </div>
               <div className="flex gap-4 opacity-40">
                  <MoreHorizontal size={20} />
                  <Send size={20} />
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}