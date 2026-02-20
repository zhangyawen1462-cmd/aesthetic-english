// ============================================================
// 调试工具：检查 Dashboard 布局数据
// ============================================================

import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const DATABASE_ID = process.env.NOTION_DB_LESSONS!;

export async function GET() {
  try {
    // 查询所有已发布的课程
    const allPublished = await notion.databases.query({
      database_id: DATABASE_ID,
      filter: {
        property: 'Status',
        select: {
          equals: 'Published'
        }
      }
    });

    // 查询 dashboard-featured 的课程
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
      },
      sorts: [
        {
          property: 'Sort_Order',
          direction: 'ascending'
        }
      ]
    });

    // 提取关键信息
    const allLessons = allPublished.results.map((page: any) => {
      if (!('properties' in page)) return null;
      const props = page.properties;
      return {
        id: props.Lesson_ID?.title?.[0]?.plain_text || 'N/A',
        status: props.Status?.select?.name || 'N/A',
        displayPosition: props.Display_Position?.select?.name || 'none',
        sortOrder: props.Sort_Order?.number ?? null,
        contentType: props.Content_Type?.select?.name || 'N/A',
        titleCn: props.Title_CN?.rich_text?.[0]?.plain_text || '',
        titleEn: props.Title_EN?.rich_text?.[0]?.plain_text || '',
      };
    }).filter(Boolean);

    const featuredLessons = dashboardFeatured.results.map((page: any) => {
      if (!('properties' in page)) return null;
      const props = page.properties;
      return {
        id: props.Lesson_ID?.title?.[0]?.plain_text || 'N/A',
        sortOrder: props.Sort_Order?.number ?? null,
        contentType: props.Content_Type?.select?.name || 'N/A',
        titleCn: props.Title_CN?.rich_text?.[0]?.plain_text || '',
        titleEn: props.Title_EN?.rich_text?.[0]?.plain_text || '',
      };
    }).filter(Boolean);

    return NextResponse.json({
      success: true,
      summary: {
        totalPublished: allPublished.results.length,
        dashboardFeatured: dashboardFeatured.results.length,
      },
      allLessons,
      featuredLessons,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Debug API Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch debug info',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}


























