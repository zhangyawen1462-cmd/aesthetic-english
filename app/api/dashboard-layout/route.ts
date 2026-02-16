// ============================================================
// API Route: 获取 Dashboard 布局
// ============================================================

import { NextResponse } from 'next/server';
import { getDashboardLayout } from '@/lib/notion-client';

// ISR: 每5分钟重新验证一次
export const revalidate = 300;

export async function GET() {
  try {
    const lessons = await getDashboardLayout();
    
    return NextResponse.json({
      success: true,
      data: lessons,
      count: lessons.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('API Error - /api/dashboard-layout:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch dashboard layout',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
