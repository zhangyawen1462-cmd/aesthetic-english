"use client";

import React from "react";
import { motion } from "framer-motion";
import { MessageSquare } from "lucide-react";
import type { SalonData } from "@/data/types";

import type { ThemeConfig } from "@/lib/theme-config";

interface ModuleSalonProps {
  theme: ThemeConfig;
  data?: SalonData;
}

export default function ModuleSalon({ theme, data }: ModuleSalonProps) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden">

      {/* 纹理背景 */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-noise mix-blend-multiply" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="flex flex-col items-center text-center px-6"
      >
        {/* 图标 */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-8 border"
          style={{ borderColor: theme.lineColor, color: theme.text }}
        >
          <MessageSquare size={28} strokeWidth={1} style={{ opacity: 0.4 }} />
        </div>

        {/* 标题 */}
        <h2 className="font-serif text-3xl italic mb-4" style={{ color: theme.text }}>
          The Salon
        </h2>

        {/* 引言 */}
        <p className="font-serif italic text-sm opacity-40 max-w-md leading-relaxed mb-8" style={{ color: theme.text }}>
          {data?.openingLine || "A space for thoughtful discussion is being prepared..."}
        </p>

        {/* 分隔线 */}
        <div className="h-[1px] w-16 mb-6" style={{ backgroundColor: theme.accent, opacity: 0.3 }} />

        {/* 状态 */}
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: theme.accent }} />
          <span className="text-[10px] uppercase tracking-[0.3em] opacity-40" style={{ color: theme.text }}>
            Coming Soon
          </span>
        </div>
      </motion.div>
    </div>
  );
}
