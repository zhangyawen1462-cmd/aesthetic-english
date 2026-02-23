"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Lock, Crown, Calendar, Infinity, Sparkles } from "lucide-react";
import { useMembership } from "@/context/MembershipContext";
import type { MembershipTier } from "@/lib/permissions";

const DEV_PASSWORD = "456852";

export default function DevPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [mounted, setMounted] = useState(false);
  
  // 🎯 使用 Context 获取状态
  const { tier, devTier, setDevTier } = useMembership();

  // 🔒 只在开发环境显示
  const isDevelopment = process.env.NODE_ENV === 'development';

  // 初始化：防止水合不匹配 + 检查认证状态
  useEffect(() => {
    setMounted(true);
    
    // 只在开发环境检查认证
    if (isDevelopment) {
      const devAuth = localStorage.getItem("dev_authenticated");
      if (devAuth === "true") {
        setIsAuthenticated(true);
      }
    }
  }, [isDevelopment]);

  // 如果不是开发环境或未挂载，直接返回 null
  if (!isDevelopment || !mounted) {
    return null;
  }

  // 验证密码
  const handleAuth = () => {
    if (password === DEV_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem("dev_authenticated", "true");
      setPassword("");
    } else {
      alert("密码错误");
    }
  };

  // 切换会员类型（实时生效，无需刷新）
  const switchMembership = (type: MembershipTier) => {
    setDevTier(type);
  };

  // 退出开发者模式
  const logout = () => {
    localStorage.removeItem("dev_authenticated");
    setIsAuthenticated(false);
    setIsOpen(false);
  };

  const membershipTypes = [
    { id: "visitor" as MembershipTier, name: "游客", subname: "Visitor", icon: Lock, color: "#999", badge: "0" },
    { id: "trial" as MembershipTier, name: "试用用户", subname: "Trial User", icon: Sparkles, color: "#10b981", badge: "🎁" },
    { id: "quarterly" as MembershipTier, name: "季度会员", subname: "The Season", icon: Calendar, color: "#3b82f6", badge: "90" },
    { id: "yearly" as MembershipTier, name: "年度会员", subname: "The Resident", icon: Crown, color: "#f59e0b", badge: "365" },
    { id: "lifetime" as MembershipTier, name: "永久会员", subname: "The Patron", icon: Infinity, color: "#8b5cf6", badge: "∞" },
  ];

  return (
    <>
      {/* 触发按钮 - 固定在右下角，避开色板 */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 right-6 z-[9999] w-12 h-12 rounded-full bg-black/80 backdrop-blur-sm flex items-center justify-center shadow-lg hover:bg-black transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isOpen ? (
          <EyeOff size={20} className="text-white" />
        ) : (
          <Eye size={20} className="text-white" />
        )}
      </motion.button>

      {/* 开发者面板 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-36 right-6 z-[9999] w-80 bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200"
          >
            {!isAuthenticated ? (
              // 密码验证界面
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">开发者模式</h3>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAuth()}
                  placeholder="输入密码"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleAuth}
                  className="w-full py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  验证
                </button>
              </div>
            ) : (
              // 会员切换界面
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">会员类型切换</h3>
                  <button
                    onClick={logout}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    退出
                  </button>
                </div>

                {/* 当前状态显示 */}
                <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">当前模拟身份</p>
                      <p className="text-sm font-bold text-gray-900">
                        {devTier ? devTier.toUpperCase() : tier ? tier.toUpperCase() : 'NONE'}
                      </p>
                    </div>
                    {devTier && (
                      <Sparkles size={20} className="text-purple-500" />
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  {membershipTypes.map((type) => {
                    const Icon = type.icon;
                    const isActive = devTier === type.id;

                    return (
                      <button
                        key={type.id || "none"}
                        onClick={() => switchMembership(type.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                          isActive
                            ? "bg-gray-900 text-white shadow-lg scale-[1.02]"
                            : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <Icon
                          size={20}
                          style={{ color: isActive ? "#fff" : type.color }}
                        />
                        <div className="flex-1 text-left">
                          <p className="font-medium text-sm">{type.name}</p>
                          {type.subname && (
                            <p className={`text-xs ${isActive ? 'text-white/70' : 'text-gray-500'}`}>
                              {type.subname}
                            </p>
                          )}
                        </div>
                        <span className={`text-xs font-mono px-2 py-1 rounded ${
                          isActive ? 'bg-white/20' : 'bg-gray-200'
                        }`}>
                          {type.badge}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-1">
                    <Sparkles size={12} />
                    实时生效，无需刷新页面
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

