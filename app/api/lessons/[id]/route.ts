// ============================================================
// API Route: 获取单个课程详情
// 🔐 权限保护：根据用户会员等级返回不同的数据
// ============================================================

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { getLessonById } from '@/lib/notion-client';
import { checkVideoAccess } from '@/lib/permissions';
import type { MembershipTier, VideoSection } from '@/lib/permissions';

// ISR: 每5分钟重新验证一次
export const revalidate = 300;

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

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

    // 🔐 验证用户会员等级
    let tier: MembershipTier = null;
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get('ae_membership')?.value;
      if (token) {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        tier = payload.tier as MembershipTier;
      }
    } catch (error) {
      // Token 无效，视为游客
      tier = null;
    }

    // 🔧 开发环境：跳过权限检查
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({
        success: true,
        data: lesson,
        timestamp: new Date().toISOString(),
      });
    }

    // 🔐 权限检查
    const section = lesson.category as VideoSection;
    const isSample = lesson.isSample || false;
    const hasAccess = checkVideoAccess(tier, section, isSample);

    // 如果没有权限，返回受限数据
    if (!hasAccess) {
      return NextResponse.json({
        success: true,
        data: {
          id: lesson.id,
          titleCn: lesson.titleCn,
          titleEn: lesson.titleEn,
          category: lesson.category,
          ep: lesson.ep,
          coverImg: lesson.coverImg,
          coverRatio: lesson.coverRatio,
          isSample: lesson.isSample,
          // 🔒 敏感数据全部隐藏
          videoUrl: '', // 不返回视频 URL
          srtRaw: '', // 不返回字幕
          vocab: [], // 不返回词汇
          grammar: [], // 不返回语法
          recall: '', // 不返回回忆测试
          salon: null, // 不返回 AI Salon 数据
          _restricted: true, // 标记为受限数据
          _requiredTier: section === 'business' ? 'yearly' : section === 'cognitive' && !isSample ? 'yearly' : 'quarterly'
        },
        timestamp: new Date().toISOString(),
      });
    }

    // ✅ 有权限，返回完整数据
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

