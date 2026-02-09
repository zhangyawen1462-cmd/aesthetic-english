"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, CalendarCheck, Bookmark, X, Send, Sparkles } from "lucide-react";
import emailjs from '@emailjs/browser';

export default function Sidebar() {
  const router = useRouter();
  const [isSuggestionOpen, setIsSuggestionOpen] = useState(false);
  const [suggestionText, setSuggestionText] = useState("");
  const [isSent, setIsSent] = useState(false);

  // 模拟打卡天数
  const [streakDays, setStreakDays] = useState(7);

  // 处理发送建议 (集成 EmailJS)
  const handleSendSuggestion = () => {
    if (!suggestionText.trim()) return;

    // --- 使用你提供的信息配置 EmailJS ---
    const serviceID = 'service_ydutc7o';
    const templateID = 'template_y2owl27';
    const publicKey = 'bNbCLQhjCAdQD9ksi';

    // 匹配模板截图中的变量：{{name}}, {{email}}, {{message}}
    const templateParams = {
      name: "Aesthetic User",         // 对应模板中的 {{name}}
      email: "not-provided@aest.com", // 对应模板中的 {{email}}
      message: suggestionText,        // 对应模板中的 {{message}}
    };

    emailjs.send(serviceID, templateID, templateParams, publicKey)
      .then((response) => {
        console.log('SUCCESS!', response.status, response.text);
        setIsSent(true);
        // 发送成功后的仪式感动画
        setTimeout(() => {
          setIsSent(false);
          setIsSuggestionOpen(false);
          setSuggestionText("");
        }, 2000);
      }, (err) => {
        console.error('FAILED...', err);
        alert(`发送失败: ${err.text || '请检查网络或配置'}`);
      });
  };

  return (
    <>
      <div className="fixed left-0 top-1/2 z-50 flex -translate-y-1/2 flex-col gap-5 pl-0 font-serif">
        <BookmarkItem 
          color="bg-plum-wine" 
          accent="border-l-2 border-white/20" 
          icon={<Mail size={16} />} 
          label="Suggestion Box" 
          onClick={() => setIsSuggestionOpen(true)}
        />
        <BookmarkItem 
          color="bg-golden-sand" 
          accent="border-l-2 border-plum-wine/30" 
          icon={<CalendarCheck size={16} className="text-plum-wine" />} 
          label={`Streak: Day ${streakDays}`}
          textColor="text-plum-wine"
        />
        <BookmarkItem 
          color="bg-[#4A4A40]" 
          accent="border-l-2 border-white/20" 
          icon={<Bookmark size={16} />} 
          label="My Notebook" 
          onClick={() => router.push('/dashboard/notebook')}
        />
      </div>

      <AnimatePresence>
        {isSuggestionOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsSuggestionOpen(false)}
              className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: -300, opacity: 0, rotate: -5 }}
              animate={{ x: 0, opacity: 1, rotate: 0 }}
              exit={{ x: -300, opacity: 0, rotate: -10 }}
              className="fixed left-4 top-1/2 z-[70] w-[350px] -translate-y-1/2 md:left-20"
            >
              <div className="relative overflow-hidden rounded-sm bg-[#F9F8F3] p-1 shadow-2xl">
                <div className="border-2 border-double border-plum-wine/20 h-full w-full p-6 flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-plum-wine/10 pb-4">
                    <div className="flex flex-col">
                      <span className="font-serif text-xl italic text-plum-wine">Dear Creator,</span>
                      <span className="text-[10px] uppercase tracking-widest text-plum-wine/50">Send your thoughts</span>
                    </div>
                    <button onClick={() => setIsSuggestionOpen(false)} className="text-plum-wine/40 hover:text-plum-wine transition-colors">
                      <X size={18} />
                    </button>
                  </div>

                  {isSent ? (
                    <div className="flex h-40 flex-col items-center justify-center gap-3 text-plum-wine animate-pulse">
                      <Sparkles size={32} />
                      <span className="font-serif italic">Received with thanks.</span>
                    </div>
                  ) : (
                    <textarea 
                      autoFocus
                      className="h-40 w-full resize-none bg-transparent font-serif text-sm leading-relaxed text-plum-wine placeholder:text-plum-wine/30 focus:outline-none"
                      placeholder="I wish the next episode would cover..."
                      value={suggestionText}
                      onChange={(e) => setSuggestionText(e.target.value)}
                    />
                  )}

                  {!isSent && (
                    <div className="flex justify-end pt-2">
                      <button 
                        onClick={handleSendSuggestion}
                        className="group flex items-center gap-2 rounded-sm bg-plum-wine px-4 py-2 text-[10px] uppercase tracking-widest text-ecru transition-all hover:bg-plum-wine/90"
                      >
                        <span>Send Letter</span>
                        <Send size={12} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="pointer-events-none absolute inset-0 bg-noise opacity-30 mix-blend-multiply" />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function BookmarkItem({ color, accent, icon, label, onClick, textColor = "text-ecru" }: any) {
  return (
    <motion.div
      onClick={onClick}
      initial={{ x: -120 }}
      animate={{ x: -105 }}
      whileHover={{ x: 0 }}
      className={`relative flex cursor-pointer items-center gap-4 rounded-r-lg ${color} ${accent} py-3 pl-5 pr-6 ${textColor} shadow-lg z-50`}
    >
      <div className="absolute inset-0 rounded-r-lg bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
      <span className="opacity-90 relative z-10">{icon}</span>
      <span className="whitespace-nowrap text-xs font-medium uppercase tracking-widest opacity-90 relative z-10">{label}</span>
    </motion.div>
  );
}