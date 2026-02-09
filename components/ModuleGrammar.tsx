"use client";

import React from "react";
import { Bookmark, Hash } from "lucide-react";

interface ModuleGrammarProps {
  theme: any;
  onSeek: (time: number) => void;
}

const GRAMMAR_NOTES = [
  { id: 1, point: "系表结构与身份界定", desc: "Linking Verb (be) 连接主语与表语。在本句语境中，'We are...' 不仅是陈述事实，更是一种群体身份的强烈宣告 (Identity Declaration)。", ex: "Ex: She is a dancer. (主语 + be + 名词)", start: 0.1 },
  { id: 2, point: "隐喻 (Metaphor) 的通感", desc: "将视觉/空间概念 (City) 转化为听觉概念 (Symphony)。'Symphony' 暗示了混乱中的有序 (Ordered Chaos)，将城市的喧嚣升华为宏大的乐章。", ex: "Ex: The city is a symphony. (A is B)", start: 8.6 },
  { id: 3, point: "平行否定结构", desc: "'Not just A, but B' 的口语变体。通过省略连词 'but'，增加了句子的断裂感和力量感。", ex: "Ex: It's not just clothes, it's attitude.", start: 15.1 },
  { id: 4, point: "象征意象：Velvet Rope", desc: "Velvet Rope (天鹅绒围栏) 是排他性 (Exclusivity) 和特权 (Privilege) 的物理象征。", ex: "Ex: Beyond the velvet rope lies the VIP area.", start: 12.1 },
];

export default function ModuleGrammar({ theme, onSeek }: ModuleGrammarProps) {
  // ✅ 核心逻辑：直接继承，不猜颜色
  // 所有的颜色都基于 theme.text 和 theme.accent
  
  return (
    <div className="flex-1 w-full h-full flex flex-col relative overflow-hidden" 
         style={{ color: theme.text }}>

      {/* 🎨 局部纹理：冷压水彩纸质感 (Cold Press Paper) */}
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

      {/* 顶部：极简刊头 */}
      <div className="w-full px-8 py-6 border-b-2 sticky top-0 backdrop-blur-md z-20 flex justify-between items-end"
           style={{ borderColor: theme.text, backgroundColor: theme.bg }}>
        <h1 className="text-xl font-bold tracking-tight" 
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif' }}>
          Grammar Notes
        </h1>
        <span className="text-[10px] font-mono opacity-50">VOL. 01 / SYNTAX</span>
      </div>

      <div className="flex-1 w-full max-w-3xl mx-auto overflow-y-auto px-8 pb-40 no-scrollbar pt-12">
        <div className="flex flex-col gap-12">
          
          {GRAMMAR_NOTES.map((item, index) => (
            <div key={item.id} className="group relative pl-8 cursor-pointer transition-transform duration-300 hover:translate-x-1"
                 onClick={() => onSeek(item.start)}>
              
              {/* 左侧装饰线 (实色，不渐变) */}
              <div className="absolute left-0 top-0 bottom-0 w-[2px] transition-all duration-300 group-hover:w-[4px]"
                   style={{ backgroundColor: theme.accent }} />
              
              {/* 索引号 */}
              <div className="absolute -left-[3px] -top-5 text-[40px] font-black opacity-10 leading-none select-none font-sans"
                   style={{ color: theme.text }}>
                {String(index + 1).padStart(2, '0')}
              </div>

              {/* 1. 标题 (苹果简体) */}
              <div className="flex items-center gap-2 mb-3">
                <Bookmark size={14} style={{ color: theme.accent }} fill="currentColor" />
                <h3 className="text-[17px] font-bold tracking-wide" 
                    style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif' }}>
                  {item.point}
                </h3>
              </div>

              {/* 2. 详细解释 (宋体) */}
              <p className="text-[15px] leading-relaxed text-justify mb-4 opacity-90" 
                 style={{ fontFamily: '"Songti SC", "SimSun", serif' }}>
                {item.desc}
              </p>

              {/* 3. 举例 (Verdana + 宋体) */}
              <div className="p-3 border-l-2 bg-black/5 dark:bg-white/5"
                   style={{ borderColor: theme.accent }}>
                <p className="text-[13px] font-bold leading-normal" 
                   style={{ fontFamily: 'Verdana, sans-serif' }}>
                  {/* 简单的正则处理，让中文显示为宋体，英文显示为 Verdana */}
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
          ))}

          <div className="flex justify-center opacity-20 py-8">
            <Hash size={16} />
          </div>

        </div>
      </div>
    </div>
  );
}