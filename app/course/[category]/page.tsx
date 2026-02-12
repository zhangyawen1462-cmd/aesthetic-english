"use client";

import React from "react";
import { useParams } from "next/navigation";
import DailyCinemaView from "@/components/course/DailyCinemaView";
import CognitiveCatalogView from "@/components/course/CognitiveCatalogView";
import BusinessRiverView from "@/components/course/BusinessRiverView";

// --- 1. 模拟数据 (中英双语) ---
const ALL_COURSES = [
  { id: "01", vol: "VOL. 01", titleCN: "晨间唤醒", titleEN: "The Morning Ritual", duration: "12:04", image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1200", desc: "从研磨咖啡豆的声音开始，建立英语的肌肉记忆。" },
  { id: "02", vol: "VOL. 02", titleCN: "午夜爵士", titleEN: "Midnight Improvisation", duration: "08:45", image: "https://images.unsplash.com/photo-1514525253440-b393452e8d26?q=80&w=1200", desc: "像萨克斯风一样呼吸，学习停顿与连读的艺术。" },
  { id: "03", vol: "VOL. 03", titleCN: "画廊漫步", titleEN: "The Gallery Silence", duration: "15:20", image: "https://images.unsplash.com/photo-1518998053901-5348d3969105?q=80&w=1200", desc: "如何描述那些无法被描述的美，视觉词汇的积累。" },
  { id: "04", vol: "VOL. 04", titleCN: "地铁独白", titleEN: "Subway Inner Voice", duration: "10:10", image: "https://images.unsplash.com/photo-1470163395405-d2b80e7450ed?q=80&w=1200", desc: "在拥挤的人潮中找到内心的宁静与表达。" },
  { id: "05", vol: "VOL. 05", titleCN: "雨天书房", titleEN: "Rainy Day Reading", duration: "14:30", image: "https://images.unsplash.com/photo-1507842217121-ca7633be5f43?q=80&w=1200", desc: "关于忧郁与平静的高级词汇。" },
  { id: "06", vol: "VOL. 06", titleCN: "旧日信笺", titleEN: "Vintage Letters", duration: "11:00", image: "https://images.unsplash.com/photo-1579273166152-d725a4e2b755?q=80&w=1200", desc: "书信体中的优雅措辞。" },
];

// --- 2. 主入口组件 ---
export default function DynamicCategoryPage() {
  const params = useParams();
  const category = (Array.isArray(params.category) ? params.category[0] : params.category) || "daily";

  // 根据 category 路由到不同的视图组件
  if (category === "daily") {
    return <DailyCinemaView />;
  } 
  
  if (category === "cognitive") {
    return <CognitiveCatalogView data={ALL_COURSES} category={category} />;
  } 
  
  if (category === "business") {
    return <BusinessRiverView data={ALL_COURSES} category={category} />;
  }

  // 默认回退
  return <DailyCinemaView />;
}

