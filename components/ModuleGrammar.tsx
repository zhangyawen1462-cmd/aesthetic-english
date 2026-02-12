"use client";

import React, { useState, useEffect } from "react";
import { Bookmark, Hash, Check } from "lucide-react";
import type { GrammarNote } from "@/data/types";
import { toggleNotebook, getNotebookByLesson } from "@/lib/notebook-store";

import type { ThemeConfig } from "@/lib/theme-config";

interface ModuleGrammarProps {
  theme: ThemeConfig;
  onSeek: (time: number) => void;
  grammarNotes: GrammarNote[];
  lessonId: string;
}

export default function ModuleGrammar({ theme, onSeek, grammarNotes, lessonId }: ModuleGrammarProps) {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  // 初始化：从 localStorage 读取已收藏的语法点
  useEffect(() => {
    const items = getNotebookByLesson(lessonId);
    const ids = new Set(
      items.filter(i => i.type === 'grammar').map(i => i.id)
    );
    setSavedIds(ids);
  }, [lessonId]);

  const handleToggleSave = (item: GrammarNote, e: React.MouseEvent) => {
    e.stopPropagation();
    const itemId = `${lessonId}-grammar-${item.id}`;
    const isNowSaved = toggleNotebook({
      id: itemId,
      lessonId,
      type: 'grammar',
      content: item.point,
      sub: item.ex,
      note: item.desc,
      timestamp: item.start,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
    });
    setSavedIds(prev => {
      const next = new Set(prev);
      if (isNowSaved) next.add(itemId);
      else next.delete(itemId);
      return next;
    });
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col relative overflow-hidden"
      style={{ color: theme.text }}>

      {/* 幽灵图层背景 - 推荐比例 3:4 竖向图（适合文字阅读） */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-[0.03] mix-blend-multiply"
          style={{ 
            backgroundImage: `url('/images/module-bg/grammar.jpg')`,
            filter: 'blur(1.5px) grayscale(50%)'
          }}
        />
      </div>

      {/* 局部纹理 */}
      <svg className="absolute opacity-0 pointer-events-none">
        <filter id="paper-roughness">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.4" />
          </feComponentTransfer>
          <feBlend mode="multiply" in2="SourceGraphic" />
        </filter>
      </svg>

      {/* 顶部刊头 */}
      <div className="w-full px-8 py-6 border-b-2 sticky top-0 backdrop-blur-md z-20 flex justify-between items-end"
        style={{ borderColor: theme.text, backgroundColor: theme.bg }}>
        <h1 className="text-xl font-bold tracking-tight"
          style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif' }}>
          Grammar Notes
        </h1>
        <span className="text-[10px] font-mono opacity-50">VOL. 01 / SYNTAX</span>
      </div>

      <div className="flex-1 w-full max-w-3xl mx-auto overflow-y-auto px-8 pb-40 no-scrollbar pt-12">

        {grammarNotes.length === 0 && (
          <div className="flex items-center justify-center h-40 opacity-30">
            <p className="text-[10px] uppercase tracking-widest">No grammar notes available</p>
          </div>
        )}

        <div className="flex flex-col gap-12">
          {grammarNotes.map((item, index) => {
            const itemId = `${lessonId}-grammar-${item.id}`;
            const isSaved = savedIds.has(itemId);

            return (
              <div key={item.id} className="group relative pl-8 cursor-pointer transition-transform duration-300 hover:translate-x-1"
                onClick={() => onSeek(item.start)}>

                {/* 左侧装饰线 */}
                <div className="absolute left-0 top-0 bottom-0 w-[2px] transition-all duration-300 group-hover:w-[4px]"
                  style={{ backgroundColor: theme.accent }} />

                {/* 索引号 */}
                <div className="absolute -left-[3px] -top-5 text-[40px] font-black opacity-10 leading-none select-none font-sans"
                  style={{ color: theme.text }}>
                  {String(index + 1).padStart(2, '0')}
                </div>

                {/* 1. 标题 + 收藏按钮 */}
                <div className="flex items-center gap-2 mb-3">
                  <button
                    onClick={(e) => handleToggleSave(item, e)}
                    className={`transition-all duration-500 hover:scale-110 ${isSaved ? 'opacity-100' : 'opacity-40 hover:opacity-80'}`}
                    style={{ color: isSaved ? theme.accent : theme.text }}
                  >
                    {isSaved ? <Check size={14} /> : <Bookmark size={14} />}
                  </button>
                  <h3 className="text-[17px] font-bold tracking-wide"
                    style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif' }}>
                    {item.point}
                  </h3>
                </div>

                {/* 2. 详细解释（宋体） */}
                <p className="text-[15px] leading-relaxed text-justify mb-4 opacity-90"
                  style={{ fontFamily: '"Songti SC", "SimSun", serif' }}>
                  {item.desc}
                </p>

                {/* 3. 举例（Verdana + 宋体混排） */}
                <div className="p-3 border-l-2 bg-black/5 dark:bg-white/5"
                  style={{ borderColor: theme.accent }}>
                  <p className="text-[13px] font-bold leading-normal"
                    style={{ fontFamily: 'Verdana, sans-serif' }}>
                    {item.ex.split(/([\u4e00-\u9fa5]+)/g).map((chunk, i) => {
                      const isChinese = /[\u4e00-\u9fa5]/.test(chunk);
                      return (
                        <span key={i} style={{ fontFamily: isChinese ? '"Songti SC", serif' : 'Verdana, sans-serif' }}>
                          {chunk}
                        </span>
                      );
                    })}
                  </p>
                </div>
              </div>
            );
          })}

          <div className="flex justify-center opacity-20 py-8">
            <Hash size={16} />
          </div>
        </div>
      </div>
    </div>
  );
}
