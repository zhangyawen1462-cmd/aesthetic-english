import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const DATABASE_ID = process.env.NOTION_DB_LESSONS!;

// 辅助函数：根据 Lesson_ID 查找 Notion Page ID
async function getPageIdByLessonId(lessonId: string): Promise<string | null> {
  try {
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      filter: {
        property: 'Lesson_ID',
        title: {
          equals: lessonId
        }
      }
    });

    if (response.results.length > 0) {
      return response.results[0].id;
    }
    return null;
  } catch (error) {
    console.error(`查找 Lesson_ID=${lessonId} 失败:`, error);
    return null;
  }
}

// POST: 将课程从布局中移除，改回 available-pool
export async function POST(request: NextRequest) {
  try {
    const { lessonId } = await request.json();

    if (!lessonId) {
      return NextResponse.json(
        { success: false, error: '缺少 lessonId 参数' },
        { status: 400 }
      );
    }

    const pageId = await getPageIdByLessonId(lessonId);
    
    if (!pageId) {
      return NextResponse.json(
        { success: false, error: '未找到对应的课程' },
        { status: 404 }
      );
    }

    // 清空 Display_Position 和 Sort_Order
    await notion.pages.update({
      page_id: pageId,
      properties: {
        Display_Position: { select: null },  // 清空字段
        Sort_Order: { number: null }         // 清空字段
      }
    });

    return NextResponse.json({ 
      success: true,
      message: `课程 ${lessonId} 的 Display_Position 已清空`
    });

  } catch (error) {
    console.error('移除课程失败:', error);
    return NextResponse.json(
      { success: false, error: '移除课程失败' },
      { status: 500 }
    );
  }
}

