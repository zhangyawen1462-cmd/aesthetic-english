"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Check } from "lucide-react";
import type { RecallText } from "@/data/types";

import type { ThemeConfig } from "@/lib/theme-config";

interface ModuleRecallProps {
  theme: ThemeConfig;
  recallText: RecallText;
}

export default function ModuleRecall({ theme, recallText }: ModuleRecallProps) {
  const [note, setNote] = useState("");
  const [isRevealed, setIsRevealed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const color = theme.text;
  const borderColor = theme.text;
  const paperColor = theme.bg;

  useEffect(() => {
    const saved = localStorage.getItem("recall_archive_v1");
    if (saved) setNote(saved);
  }, []);

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNote(e.target.value);
    localStorage.setItem("recall_archive_v1", e.target.value);
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 1500);
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col relative overflow-hidden" style={{ color: color }}>

      {/* 顶部档案号 */}
      <div className="w-full px-8 py-6 flex justify-between items-end border-b-2 z-30 sticky top-0 backdrop-blur-md"
        style={{ borderColor: borderColor, backgroundColor: paperColor }}>
        <h1 className="text-4xl font-black tracking-tighter leading-none" style={{ fontFamily: 'Verdana' }}>
          RECALL
        </h1>
        <div className="text-right">
          <div className="text-[9px] uppercase tracking-widest opacity-50">Archive No.</div>
          <div className="text-sm font-mono font-bold">06-REC-2024</div>
        </div>
      </div>

      <div className="flex-1 w-full max-w-3xl mx-auto overflow-y-auto px-8 pb-40 no-scrollbar space-y-12 pt-12">

        {/* EXHIBIT A: SOURCE */}
        <div className="relative border-l-2 pl-6" style={{ borderColor: theme.accent }}>
          <div className="absolute -left-[9px] -top-1 w-4 h-4 rounded-full border-2 bg-transparent"
            style={{ borderColor: theme.accent, backgroundColor: paperColor }} />

          <div className="mb-4 flex items-center gap-2 opacity-50">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Exhibit A: Source Text</span>
          </div>

          <p className="text-xl md:text-2xl font-medium leading-relaxed text-justify font-serif"
            style={{ fontFamily: '"Songti SC", serif' }}>
            {recallText.cn}
          </p>
        </div>

        {/* EXHIBIT B: TARGET (The Veil) */}
        <div className="relative border-l-2 pl-6" style={{ borderColor: theme.accent }}>
          <div className="absolute -left-[9px] -top-1 w-4 h-4 rounded-full border-2 bg-transparent"
            style={{ borderColor: theme.accent, backgroundColor: paperColor }} />

          <div className="mb-4 flex items-center gap-2 opacity-50">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Exhibit B: Target Text</span>
          </div>

          <div className="relative min-h-[160px]">
            {/* 底层真迹 */}
            <p className="text-[17px] leading-loose font-normal text-justify"
              style={{ fontFamily: 'Verdana, sans-serif' }}>
              {recallText.en}
            </p>

            {/* 顶层遮罩 */}
            <motion.div
              initial={false}
              animate={{ y: isRevealed ? "110%" : "0%" }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="absolute -top-4 -left-4 -right-4 -bottom-4 z-20 flex flex-col items-center justify-center cursor-pointer border-2"
              onClick={() => setIsRevealed(!isRevealed)}
              style={{
                backgroundColor: paperColor,
                borderColor: borderColor,
                borderStyle: 'dashed',
              }}
            >
              <div className="flex flex-col items-center gap-2 opacity-100">
                <div className="bg-current p-2 rounded-full" style={{ color: color }}>
                  {isRevealed ? <EyeOff size={24} className="text-white mix-blend-difference" /> : <Eye size={24} className="text-white mix-blend-difference" />}
                </div>
                <span className="text-[11px] font-black uppercase tracking-[0.3em] border-b-2 pb-1" style={{ borderColor: theme.accent }}>
                  Confidential
                </span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* WORKSPACE */}
        <div className="relative pt-8 border-t-2" style={{ borderColor: borderColor }}>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 text-[10px] uppercase tracking-widest font-bold"
            style={{ backgroundColor: paperColor }}>
            Translator&apos;s Log
          </div>

          <textarea
            value={note}
            onChange={handleNoteChange}
            placeholder="Type translation notes..."
            className="w-full min-h-[200px] bg-transparent text-[16px] leading-relaxed outline-none resize-y font-serif placeholder:opacity-20"
            style={{ color: color }}
            spellCheck={false}
          />

          <div className="absolute bottom-0 right-0">
            <AnimatePresence>
              {isSaving && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-2 opacity-50">
                  <Check size={12} /> <span className="text-[9px] uppercase font-bold">Saved</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
}
