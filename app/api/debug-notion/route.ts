// ============================================================
// API Route: 调试 Notion 数据库内容
// ============================================================

import { NextResponse } from 'next/server';
import { getAllLessons } from '@/lib/notion-client';

export async function GET() {
  try {
    const lessons = await getAllLessons();
    
    // 整理数据摘要
    const summary = {
      总课程数: lessons.length,
      分类统计: {
        daily: lessons.filter(l => l.category === 'daily').length,
        cognitive: lessons.filter(l => l.category === 'cognitive').length,
        business: lessons.filter(l => l.category === 'business').length,
      },
      显示位置统计: {
        'dashboard-featured': lessons.filter(l => l.displayPosition === 'dashboard-featured').length,
        'daily-cinema': lessons.filter(l => l.displayPosition === 'daily-cinema').length,
        'cognitive-featured': lessons.filter(l => l.displayPosition === 'cognitive-featured').length,
        'business-featured': lessons.filter(l => l.displayPosition === 'business-featured').length,
      },
      课程列表: lessons.map(l => ({
        ID: l.id,
        分类: l.category,
        集数: l.ep,
        中文标题: l.titleCn,
        英文标题: l.titleEn,
        封面图: l.coverImg ? '✅' : '❌',
        '16:9封面': l.coverImg16x9 ? '✅' : '❌',
        视频: l.videoUrl ? '✅' : '❌',
        字幕: l.srtRaw ? '✅' : '❌',
        词汇数: l.vocab?.length || 0,
        语法数: l.grammar?.length || 0,
        回译: l.recall?.cn ? '✅' : '❌',
        显示位置: l.displayPosition,
        排序: l.sortOrder,
        日期: l.date,
      })),
      详细数据: lessons.map(l => ({
        id: l.id,
        category: l.category,
        ep: l.ep,
        titleCn: l.titleCn,
        titleEn: l.titleEn,
        coverImg: l.coverImg,
        coverImg16x9: l.coverImg16x9,
        videoUrl: l.videoUrl,
        srtRaw: l.srtRaw ? `${l.srtRaw.substring(0, 100)}...` : '',
        displayPosition: l.displayPosition,
        sortOrder: l.sortOrder,
        vocabCount: l.vocab?.length || 0,
        grammarCount: l.grammar?.length || 0,
        hasRecall: !!l.recall?.cn,
      })),
    };
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...summary,
    }, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('API Error - /api/debug-notion:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch Notion data',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}



