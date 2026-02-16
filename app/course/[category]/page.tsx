"use client";

import React from "react";
import { useParams } from "next/navigation";
import DailyCinemaView from "@/components/course/DailyCinemaView";
import CognitiveCatalogView from "@/components/course/CognitiveCatalogView";
import BusinessRiverView from "@/components/course/BusinessRiverView";

// --- 主入口组件 ---
export default function DynamicCategoryPage() {
  const params = useParams();
  const category = (Array.isArray(params.category) ? params.category[0] : params.category) || "daily";

  // 根据 category 路由到不同的视图组件
  if (category === "daily") {
    return <DailyCinemaView />;
  } 
  
  if (category === "cognitive") {
    return <CognitiveCatalogView category={category} />;
  } 
  
  if (category === "business") {
    return <BusinessRiverView category={category} />;
  }

  // 默认回退
  return <DailyCinemaView />;
}

