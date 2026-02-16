// ============================================================
// API Route: 按分类获取课程
// ============================================================

import { NextResponse } from 'next/server';
import { getLessonsByCategory } from '@/lib/notion-client';

// ISR: 每小时重新验证一次
export const revalidate = 3600;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ category: string }> }
) {
  try {
    const { category } = await params;
    const validCategories = ['daily', 'cognitive', 'business'];
    
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid category',
          message: `Category must be one of: ${validCategories.join(', ')}`,
        },
        { status: 400 }
      );
    }
    
    const lessons = await getLessonsByCategory(category);
    
    return NextResponse.json({
      success: true,
      data: lessons,
      category: category,
      count: lessons.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const { category } = await params;
    console.error(`API Error - /api/lessons/category/${category}:`, error);
    
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

