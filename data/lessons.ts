// ============================================================
// Aesthetic English — 课程数据中心
//
// ⚠️ 此文件已迁移到 Notion CMS
// 数据现在通过 API 从 Notion 获取
//
// 📝 添加新课程：
// 1. 登录 Notion，打开课程数据库
// 2. 新建一行，填写课程信息
// 3. 设置 Status 为 "Published"
// 4. 保存后等待 1 小时（或手动触发 revalidate）
//
// 🔗 API 端点：
// - GET /api/lessons - 获取所有课程
// - GET /api/lessons/[id] - 获取单个课程
// - GET /api/lessons/category/[category] - 按分类获取
// ============================================================

import type { Lesson, TranscriptLine, VocabCard, GrammarNote, RecallText, SalonData } from "./types";

// Re-export types for convenience
export type { Lesson, TranscriptLine, VocabCard, GrammarNote, RecallText, SalonData } from "./types";

// ============================================================
// 🔧 辅助查询函数 (Helper Functions)
// 这些函数现在从 API 获取数据，而不是从本地数组
// ============================================================

/** 根据 ID 查找课程 */
export async function getLessonById(id: string): Promise<Lesson | undefined> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/lessons/${id}`, {
      next: { revalidate: 3600 } // ISR: 1小时缓存
    });
    
    if (!response.ok) return undefined;
    
    const data = await response.json();
    return data.success ? data.data : undefined;
  } catch (error) {
    console.error(`Error fetching lesson ${id}:`, error);
    return undefined;
  }
}

/** 获取某个板块的所有课程（按数组顺序，即最新的在前） */
export async function getLessonsByCategory(category: string): Promise<Lesson[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/lessons/category/${category}`, {
      next: { revalidate: 3600 }
    });
    
    if (!response.ok) return [];
    
    const data = await response.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error(`Error fetching lessons for category ${category}:`, error);
    return [];
  }
}

/** 获取某个板块的最新 N 期 */
export async function getLatestLessons(category: string, count: number = 5): Promise<Lesson[]> {
  const lessons = await getLessonsByCategory(category);
  return lessons.slice(0, count);
}

/** 获取所有课程 */
export async function getAllLessons(): Promise<Lesson[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/lessons`, {
      next: { revalidate: 3600 }
    });
    
    if (!response.ok) return [];
    
    const data = await response.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error('Error fetching all lessons:', error);
    return [];
  }
}

// ============================================================
// 📦 临时兼容层：本地模拟数据（开发时使用）
// 当 Notion 未配置时，使用这些数据进行开发测试
// ============================================================

export const MOCK_LESSONS: Lesson[] = [
  {
    id: "mock-daily-01",
    category: "daily",
    ep: "01",
    titleCn: "示例课程（请配置Notion）",
    titleEn: "Sample Lesson (Please Configure Notion)",
    subtitle: "This is mock data for development",
    coverImg: "/images/daily-sketch.jpg",
    videoUrl: "",
    date: "Feb 13",
    srtRaw: `1
00:00:00,000 --> 00:00:03,000
This is a sample lesson.
这是一个示例课程。`,
    vocab: [
      { id: 1, word: "Sample", phonetic: "/ˈsæmpəl/", def: "A small part or quantity", ex: "This is a sample." }
    ],
    grammar: [
      { id: 1, point: "示例语法", desc: "这是一个示例语法点", ex: "Sample grammar example", start: 0 }
    ],
    recall: {
      cn: "这是一个示例课程。",
      en: "This is a sample lesson."
    }
  }
];
