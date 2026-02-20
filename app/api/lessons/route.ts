// ============================================================
// API Route: 获取所有课程
// 🔐 只返回列表所需的公开信息（标题、封面等）
// ============================================================

import { NextResponse } from 'next/server';
import { getAllLessons } from '@/lib/notion-client';

// ISR: 每小时重新验证一次
export const revalidate = 3600;

export async function GET() {
  try {
    const lessons = await getAllLessons();
    
    // 🔐 只返回列表所需的公开信息
    const publicLessons = lessons.map(lesson => ({
      id: lesson.id,
      category: lesson.category,
      ep: lesson.ep,
      titleCn: lesson.titleCn,
      titleEn: lesson.titleEn,
      subtitle: lesson.subtitle,
      coverImg: lesson.coverImg,
      coverImg16x9: lesson.coverImg16x9,
      coverRatio: lesson.coverRatio,
      date: lesson.date,
      displayPosition: lesson.displayPosition,
      sortOrder: lesson.sortOrder,
      isSample: lesson.isSample,
      // ❌ 不返回敏感数据：videoUrl, srtRaw, vocab, grammar, recall, salon
    }));
    
    return NextResponse.json({
      success: true,
      data: publicLessons,
      count: publicLessons.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('API Error - /api/lessons:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch lessons',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

