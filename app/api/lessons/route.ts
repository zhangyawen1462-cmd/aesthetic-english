// ============================================================
// API Route: 获取所有课程
// ============================================================

import { NextResponse } from 'next/server';
import { getAllLessons } from '@/lib/notion-client';

// ISR: 每小时重新验证一次
export const revalidate = 3600;

export async function GET() {
  try {
    const lessons = await getAllLessons();
    
    return NextResponse.json({
      success: true,
      data: lessons,
      count: lessons.length,
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

