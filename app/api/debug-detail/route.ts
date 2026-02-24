// ============================================================
// 详细调试工具：检查课程数据和 API 响应
// ============================================================

import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';
import { getDashboardLayout, getDailyCinemaLayout } from '@/lib/notion-client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const DATABASE_ID = process.env.NOTION_DB_LESSONS!;

export async function GET() {
  try {
    console.log('🔍 开始调试...');
    
    // 1. 检查环境变量
    const envCheck = {
      hasNotionKey: !!process.env.NOTION_API_KEY,
      hasDbId: !!process.env.NOTION_DB_LESSONS,
      dbId: process.env.NOTION_DB_LESSONS,
    };
    console.log('📋 环境变量:', envCheck);

    // 2. 查询所有课程（不过滤状态）
    console.log('📚 查询所有课程...');
    const allLessons = await notion.databases.query({
      database_id: DATABASE_ID,
    });
    console.log(`找到 ${allLessons.results.length} 个课程`);

    // 3. 查询 Published 课程
    console.log('✅ 查询 Published 课程...');
    const publishedLessons = await notion.databases.query({
      database_id: DATABASE_ID,
      filter: {
        property: 'Status',
        select: {
          equals: 'Published'
        }
      }
    });
    console.log(`找到 ${publishedLessons.results.length} 个 Published 课程`);

    // 4. 查询 Dashboard Featured 课程
    console.log('🏠 查询 Dashboard Featured 课程...');
    const dashboardFeatured = await notion.databases.query({
      database_id: DATABASE_ID,
      filter: {
        and: [
          {
            property: 'Status',
            select: {
              equals: 'Published'
            }
          },
          {
            property: 'Display_Position',
            select: {
              equals: 'dashboard-featured'
            }
          }
        ]
      }
    });
    console.log(`找到 ${dashboardFeatured.results.length} 个 Dashboard Featured 课程`);

    // 5. 测试 getDashboardLayout 函数
    console.log('🔧 测试 getDashboardLayout()...');
    const dashboardLayoutResult = await getDashboardLayout();
    console.log(`getDashboardLayout() 返回 ${dashboardLayoutResult.length} 个课程`);

    // 6. 测试 getDailyCinemaLayout 函数
    console.log('🎬 测试 getDailyCinemaLayout()...');
    const dailyCinemaLayoutResult = await getDailyCinemaLayout();
    console.log(`getDailyCinemaLayout() 返回 ${dailyCinemaLayoutResult.length} 个课程`);

    // 7. 提取详细信息
    const allLessonsDetail = allLessons.results.map((page: any) => {
      if (!('properties' in page)) return null;
      const props = page.properties;
      return {
        id: props.Lesson_ID?.title?.[0]?.plain_text || 'N/A',
        status: props.Status?.select?.name || 'none',
        displayPosition: props.Display_Position?.select?.name || 'none',
        sortOrder: props.Sort_Order?.number ?? null,
        contentType: props.Content_Type?.select?.name || 'none',
        coverImg: props.Cover_Img?.url || 'none',
        videoUrl: props.Video_URL?.url || 'none',
        titleCn: props.Title_CN?.rich_text?.[0]?.plain_text || '',
        titleEn: props.Title_EN?.rich_text?.[0]?.plain_text || '',
        category: props.Category?.select?.name || 'none',
        ep: props.EP?.rich_text?.[0]?.plain_text || '',
      };
    }).filter(Boolean);

    return NextResponse.json({
      success: true,
      environment: envCheck,
      summary: {
        total: allLessons.results.length,
        published: publishedLessons.results.length,
        dashboardFeatured: dashboardFeatured.results.length,
        dashboardLayoutFunction: dashboardLayoutResult.length,
        dailyCinemaLayoutFunction: dailyCinemaLayoutResult.length,
      },
      allLessons: allLessonsDetail,
      dashboardLayoutData: dashboardLayoutResult.map(l => ({
        id: l.id,
        sortOrder: l.sortOrder,
        titleCn: l.titleCn,
        titleEn: l.titleEn,
        coverImg: l.coverImg,
        videoUrl: l.videoUrl,
      })),
      dailyCinemaLayoutData: dailyCinemaLayoutResult.map(l => ({
        id: l.id,
        sortOrder: l.sortOrder,
        titleCn: l.titleCn,
        titleEn: l.titleEn,
        coverImg: l.coverImg,
        videoUrl: l.videoUrl,
      })),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Debug API Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch debug info',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}


































