// ============================================================
// API Route: 获取 Daily Cinema 布局
// ============================================================

import { NextResponse } from 'next/server';
import { getDailyCinemaLayout } from '@/lib/notion-client';

// ISR: 每小时重新验证一次
export const revalidate = 3600;

export async function GET() {
  try {
    const lessons = await getDailyCinemaLayout();
    
    return NextResponse.json({
      success: true,
      data: lessons,
      count: lessons.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('API Error - /api/daily-cinema-layout:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch daily cinema layout',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}






