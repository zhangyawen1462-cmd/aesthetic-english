"use client";

import { motion, useMotionValue, useSpring, LazyMotion, domAnimation, m } from "framer-motion";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import emailjs from '@emailjs/browser';

export default function LandingPage() {
  const router = useRouter();
  const [isExiting, setIsExiting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showContactFields, setShowContactFields] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  // 🚀 检测移动端
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // --- 🎨 核心色板定义 ---
  // Paper: #F7F8F9 (明信片白)
  // Ink:   #2D0F15 (纯正酒红)

  // --- 物理引擎 ---
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 50, stiffness: 1000, mass: 0.05 };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);

  useEffect(() => {
    if (typeof window !== 'undefined') {
        mouseX.set(window.innerWidth / 2);
        mouseY.set(window.innerHeight / 2);
    }

    // 🚀 优化 3：节流处理，限制更新频率到 60fps
    let rafId: number;
    let lastTime = 0;
    const throttleDelay = 16; // 约 60fps

    const throttledUpdate = (x: number, y: number) => {
      const now = Date.now();
      if (now - lastTime >= throttleDelay) {
        mouseX.set(x);
        mouseY.set(y);
        lastTime = now;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => throttledUpdate(e.clientX, e.clientY));
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) {
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => throttledUpdate(e.touches[0].clientX, e.touches[0].clientY));
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches[0]) {
        throttledUpdate(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    // 移动端陀螺仪效果（节流）
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma !== null && e.beta !== null && typeof window !== 'undefined') {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const x = centerX + (e.gamma * 8);
        const y = centerY + (e.beta * 8);
        
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => throttledUpdate(x, y));
      }
    };

    // 请求陀螺仪权限（iOS 13+ 需要）
    const requestPermission = async () => {
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        try {
          const permission = await (DeviceOrientationEvent as any).requestPermission();
          if (permission === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation);
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
          console.log('Orientation permission denied');
          }
        }
      } else {
        window.addEventListener('deviceorientation', handleOrientation);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    
    const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobileDevice) {
      requestPermission();
    }

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [mouseX, mouseY]);

  const handleEnterStudio = () => {
    setIsExiting(true);
    // 使用 replace 而不是 push，避免在历史记录中留下 Landing Page
    // 这样用户点击返回时不会回到 Landing Page
    setTimeout(() => router.replace("/dashboard"), 800);
  };

  // 📧 打开邮件弹窗
  const handleEmailClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setShowEmailModal(true);
    setShowContactFields(false);
    setFormData({ name: '', email: '', message: '' });
  };

  // 📧 点击投递按钮
  const handleSubmitMessage = () => {
    if (!formData.message.trim()) return;
    setShowContactFields(true);
  };

  // 📧 发送邮件
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSending || !formData.name || !formData.email || !formData.message) return;
    
    setIsSending(true);
    
    try {
      const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
      const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
      const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
      
      if (!serviceId || !templateId || !publicKey) {
        console.warn('⚠️ EmailJS not configured');
        alert('邮件服务未配置，请稍后再试');
        return;
      }
      
      const result = await emailjs.send(
        serviceId,
        templateId,
        {
          from_name: formData.name,
          from_email: formData.email,
          message: formData.message,
          to_email: 'aestheticenglish@outlook.com',
          timestamp: new Date().toLocaleString('zh-CN'),
        },
        publicKey
      );
      
      console.log('✅ Email sent:', result);
      setEmailSent(true);
      
      // 3秒后关闭弹窗
      setTimeout(() => {
        setShowEmailModal(false);
        setEmailSent(false);
        setShowContactFields(false);
        setFormData({ name: '', email: '', message: '' });
      }, 3000);
      
    } catch (error) {
      console.error('❌ Email send failed:', error);
      alert('发送失败，请稍后再试');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <LazyMotion features={domAnimation} strict>
    {/* ✅ 1. 背景升级：基础色 #F7F8F9 + 内阴影模拟纸张厚度 */}
    <main 
      className="flex h-[100dvh] w-full flex-col items-center justify-center overflow-hidden bg-[#F7F8F9] relative shadow-[inset_0_0_120px_rgba(0,0,0,0.02)]"
    >

      {/* ✅ 2. 艺术纸质感层 - 移动端优化 */}
      {isMobile ? (
        // 🚀 移动端：平衡性能与质感的优化版纹理
        <div 
          className="pointer-events-none fixed inset-0 z-10 opacity-[0.5] mix-blend-multiply"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='400' height='400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' seed='2'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23n)' opacity='0.8'/%3E%3C/svg%3E")`,
            backgroundSize: '400px 400px',
            filter: 'contrast(110%) brightness(102%)'
          }}
        />
      ) : (
        // 桌面端保持原有高质量纹理
        <div 
          className="pointer-events-none fixed inset-0 z-10 opacity-[0.6] mix-blend-multiply"
           style={{
             backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='paper-grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='0 0 0 0 0.9  0 0 0 0 0.9  0 0 0 0 0.9  0 0 0 0 1'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23paper-grain)' opacity='0.4'/%3E%3C/svg%3E")`,
             filter: 'contrast(120%) brightness(105%)'
           }} 
      />
      )}
      
      {/* ✅ 3. 物理光影层 (Vignette) */}
      {/* 模拟光线打在纸面上的漫反射，中间亮四周暗，增加明信片的实体感 */}
      <div className="pointer-events-none fixed inset-0 z-10"
           style={{
             background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.8) 0%, rgba(247,248,249,0) 60%, rgba(45,15,21,0.03) 100%)'
           }}
      />

      {/* 三层呼吸晕染系统 - 移动端优化 */}
      <m.div
        className="pointer-events-none fixed z-0 top-0 left-0"
        style={{ x: springX, y: springY }}
      >
        <div className="relative -translate-x-1/2 -translate-y-1/2">
          {/* 🚀 移动端：使用中等模糊半径 + 渐变边缘，更自然 */}
          <m.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.7, 0.9, 0.7] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full ${
              isMobile ? 'w-[500px] h-[500px] transform-gpu will-change-transform' : 'w-[600px] md:w-[800px] h-[600px] md:h-[800px]'
            }`}
            style={{ 
              background: isMobile 
                ? "radial-gradient(circle, rgba(45, 15, 21, 0.15) 0%, rgba(45, 15, 21, 0.08) 50%, transparent 70%)"
                : "rgba(45, 15, 21, 0.12)",
              filter: isMobile ? 'blur(60px)' : 'blur(100px)',
              mixBlendMode: 'multiply'
            }} 
          />
          <m.div
            animate={{ scale: [1.1, 1, 1.1], opacity: [0.5, 0.7, 0.5] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full ${
              isMobile ? 'w-[350px] h-[350px] transform-gpu will-change-transform' : 'w-[400px] md:w-[500px] h-[400px] md:h-[500px]'
            }`}
            style={{ 
              background: isMobile
                ? "radial-gradient(circle, rgba(45, 15, 21, 0.22) 0%, rgba(45, 15, 21, 0.12) 50%, transparent 70%)"
                : "rgba(45, 15, 21, 0.18)",
              filter: isMobile ? 'blur(45px)' : 'blur(80px)',
              mixBlendMode: 'multiply'
            }} 
          />
          <m.div
            animate={{ scale: [1, 1.05, 1], opacity: [0.6, 0.8, 0.6] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full ${
              isMobile ? 'w-[200px] h-[200px] transform-gpu will-change-transform' : 'w-[200px] md:w-[250px] h-[200px] md:h-[250px]'
            }`}
            style={{ 
              background: isMobile
                ? "radial-gradient(circle, rgba(45, 15, 21, 0.28) 0%, rgba(45, 15, 21, 0.15) 50%, transparent 70%)"
                : "rgba(45, 15, 21, 0.25)",
              filter: isMobile ? 'blur(30px)' : 'blur(50px)',
              mixBlendMode: 'multiply'
            }}
          />
        </div>
      </m.div>

      {/* 帷幕转场 (保持不变) */}
      {isExiting && (
        <m.div
          initial={{ y: "100%" }}
          animate={{ y: "0%" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-50 bg-[#2D0F15]"
        />
      )}

      {/* 内容区 */}
      <div className="z-30 flex flex-col items-center text-center px-6 relative">

        {/* 主标题 */}
        <m.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5 }}
          className="font-serif text-[2rem] md:text-[3.2rem] font-normal tracking-[0.15em] text-[#2D0F15] uppercase leading-[1.1] mix-blend-multiply"
        >
          Aesthetic{" "}
          <br className="md:hidden" />
          English
        </m.h1>

        {/* 副标题 */}
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-6 md:mt-8 flex flex-col items-center gap-4"
        >
          <div className="h-[1px] w-10 bg-[#2D0F15]/30" />
          <p className="font-serif text-base md:text-lg text-[#2D0F15]/60 tracking-[0.08em]">
            — Beauty and Brains —
          </p>
        </m.div>

        {/* CTA 按钮 */}
        <m.button
          onClick={handleEnterStudio}
          className="group mt-16 md:mt-20 relative overflow-hidden px-10 py-4 transition-all cursor-pointer touch-active"
        >
          <span className="absolute inset-0 border border-[#2D0F15]/20 group-hover:border-[#2D0F15] transition-colors duration-500" />
          <span className="absolute inset-0 bg-[#2D0F15] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
          <div className="relative flex items-center gap-3">
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#2D0F15] group-hover:text-[#F7F8F9] transition-colors duration-300 font-medium">
              Enter Studio
            </span>
            <ArrowRight className="h-3 w-3 text-[#2D0F15] group-hover:text-[#F7F8F9] transition-all group-hover:translate-x-1 duration-300" strokeWidth={1.5} />
          </div>
        </m.button>
      </div>

      {/* 底部署名 */}
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
        className="absolute bottom-8 md:bottom-10 flex flex-col items-center gap-2 z-30 safe-bottom"
      >
        <p className="text-[10px] md:text-[11px] uppercase tracking-[0.2em] text-[#2D0F15]/60 font-medium">
          Curated by Scarlett Zhang
        </p>
        <a
          href="mailto:aestheticenglish@outlook.com"
          onClick={handleEmailClick}
          className="text-[9px] tracking-[0.1em] text-[#2D0F15]/35 hover:text-[#2D0F15]/70 transition-colors cursor-pointer"
        >
          aestheticenglish@outlook.com
        </a>
      </m.div>

      {/* 📧 邮件表单弹窗 - Plum Wine 风格 */}
      {showEmailModal && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
          onClick={() => !isSending && setShowEmailModal(false)}
        >
          <m.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="relative w-full max-w-lg bg-[#2D0F15] text-[#F7F8F9] p-10 md:p-12 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 纸质纹理 */}
            <div 
              className="pointer-events-none absolute inset-0 opacity-[0.03] mix-blend-overlay"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
              }}
            />

            {emailSent ? (
              // 成功状态
              <m.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <m.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.1 }}
                  className="text-6xl mb-6"
                >
                  ✓
                </m.div>
                <h3 className="text-2xl font-serif mb-3 tracking-wide">投递成功</h3>
                <p className="text-sm opacity-60 leading-relaxed">感谢您的来信，期待与您的对话</p>
              </m.div>
            ) : (
              // 表单
              <>
                {/* 标题文案 - 逐行浮现 */}
                <m.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mb-10 space-y-5"
                  style={{ 
                    fontFamily: "'SimSun', 'Noto Serif SC', serif",
                    lineHeight: '1.9'
                  }}
                >
                  <m.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-[15px] md:text-base opacity-90"
                    style={{ textIndent: '2em' }}
                  >
                    这里，是我们精心构建的美学空间。
                  </m.p>
                  <m.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-[15px] md:text-base opacity-75"
                    style={{ textIndent: '2em' }}
                  >
                    欢迎您随时投递：无论是关于语言学习的困惑、某段表达的回响、获取原片视频的请求，还是对空间的期许和建议。
                  </m.p>
                  <m.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-[15px] md:text-base opacity-75"
                    style={{ textIndent: '2em' }}
                  >
                    期待与您进行一场跨越屏幕的对话。
                  </m.p>
                </m.div>

                {!showContactFields ? (
                  // 第一步：只显示消息框
                  <m.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="space-y-6"
                  >
                    <div>
                      <textarea
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="w-full bg-transparent border border-[#F7F8F9]/15 focus:border-[#F7F8F9]/40 outline-none p-4 text-base transition-all resize-none placeholder:text-[#F7F8F9]/30"
                        placeholder="在这里写下您想说的话..."
                        rows={6}
                        disabled={isSending}
                        autoFocus
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleSubmitMessage}
                      disabled={!formData.message.trim()}
                      className="w-full py-4 text-sm tracking-[0.3em] bg-[#F7F8F9] text-[#2D0F15] hover:bg-[#F7F8F9]/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                    >
                      投递
                    </button>
                  </m.div>
                ) : (
                  // 第二步：显示姓名和邮箱
                  <m.form
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onSubmit={handleSendEmail}
                    className="space-y-6"
                  >
                    <div>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-transparent border-b border-[#F7F8F9]/15 focus:border-[#F7F8F9]/40 outline-none py-3 text-base transition-all placeholder:text-[#F7F8F9]/30"
                        placeholder="您的姓名"
                        required
                        disabled={isSending}
                        autoFocus
                      />
                    </div>

                    <div>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-transparent border-b border-[#F7F8F9]/15 focus:border-[#F7F8F9]/40 outline-none py-3 text-base transition-all placeholder:text-[#F7F8F9]/30"
                        placeholder="您的邮箱"
                        required
                        disabled={isSending}
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowContactFields(false)}
                        disabled={isSending}
                        className="flex-1 py-4 text-sm tracking-[0.2em] border border-[#F7F8F9]/30 hover:bg-[#F7F8F9]/10 transition-all disabled:opacity-40"
                      >
                        返回
                      </button>
                      <button
                        type="submit"
                        disabled={isSending || !formData.name || !formData.email}
                        className="flex-1 py-4 text-sm tracking-[0.3em] bg-[#F7F8F9] text-[#2D0F15] hover:bg-[#F7F8F9]/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                      >
                        {isSending ? '发送中...' : '确认投递'}
                      </button>
                    </div>
                  </m.form>
                )}
              </>
            )}

            {/* 关闭按钮 */}
            {!emailSent && (
              <button
                onClick={() => setShowEmailModal(false)}
                disabled={isSending}
                className="absolute top-6 right-6 text-[#F7F8F9]/40 hover:text-[#F7F8F9]/80 transition-colors text-2xl leading-none disabled:opacity-30"
                aria-label="关闭"
              >
                ×
              </button>
            )}
          </m.div>
        </m.div>
      )}
    </main>
    </LazyMotion>
  );
}