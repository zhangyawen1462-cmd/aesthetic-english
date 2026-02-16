// ============================================================
// API Route: 获取 Cognitive Featured 布局
// ============================================================

import { NextResponse } from 'next/server';
import { getCognitiveFeaturedLayout } from '@/lib/notion-client';

// ISR: 每小时重新验证一次
export const revalidate = 3600;

export async function GET() {
  try {
    const lessons = await getCognitiveFeaturedLayout();
    
    return NextResponse.json({
      success: true,
      data: lessons,
      count: lessons.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('API Error - /api/cognitive-featured-layout:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch cognitive featured layout',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}


