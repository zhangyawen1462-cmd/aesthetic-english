// ============================================================
// API Route: 获取 Business Featured 布局
// ============================================================

import { NextResponse } from 'next/server';
import { getBusinessFeaturedLayout } from '@/lib/notion-client';

// ISR: 每小时重新验证一次
export const revalidate = 3600;

export async function GET() {
  try {
    const lessons = await getBusinessFeaturedLayout();
    
    return NextResponse.json({
      success: true,
      data: lessons,
      count: lessons.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('API Error - /api/business-featured-layout:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch business featured layout',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}


