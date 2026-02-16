// ============================================================
// API Route: 获取单个课程详情
// ============================================================

import { NextResponse } from 'next/server';
import { getLessonById } from '@/lib/notion-client';

// ISR: 每5分钟重新验证一次
export const revalidate = 300;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const lesson = await getLessonById(id);
    
    if (!lesson) {
      return NextResponse.json(
        {
          success: false,
          error: 'Lesson not found',
          message: `No lesson found with ID: ${id}`,
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: lesson,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const { id } = await params;
    console.error(`API Error - /api/lessons/${id}:`, error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch lesson',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

