import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const DATABASE_ID = process.env.NOTION_DB_LESSONS!;

interface LayoutConfig {
  dashboard: string[];
  dailyCinema: string[];
  cognitive: string[];
  business: string[];
}

// 槽位配置 - 与前端保持一致
const SLOT_RATIOS = {
  dashboard: [
    '3/4', 'square', '3/4', 'square',  // 左列
    'square', '3/4', '9/16', '3/4'     // 右列
  ],
  dailyCinema: [
    '9/16', 'square', '3/4', '9/16', 'square', '3/4'
  ],
  cognitive: ['16/9', '16/9'],
  business: ['16/9', '16/9']
};

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

// GET: 获取当前已保存的布局
export async function GET() {
  try {
    const layout: LayoutConfig = {
      dashboard: [],
      dailyCinema: [],
      cognitive: [],
      business: [],
    };

    // 查询所有已分配位置的课程
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      filter: {
        and: [
          {
            property: 'Status',
            select: { equals: 'Published' }
          },
          {
            property: 'Display_Position',
            select: { is_not_empty: true }
          }
        ]
      }
    });

    // 按照 Display_Position 和 Sort_Order 分组
    for (const page of response.results) {
      if (!('properties' in page)) continue;
      
      const props = page.properties as any;
      const lessonId = props.Lesson_ID?.title?.[0]?.plain_text || '';
      const displayPosition = props.Display_Position?.select?.name || '';
      const sortOrder = props.Sort_Order?.number || 0;

      if (!lessonId) continue;

      // 根据 Display_Position 分配到对应的布局数组
      if (displayPosition === 'dashboard-featured') {
        layout.dashboard[sortOrder] = lessonId;
      } else if (displayPosition === 'daily-cinema') {
        layout.dailyCinema[sortOrder] = lessonId;
      } else if (displayPosition === 'cognitive-featured') {
        layout.cognitive[sortOrder] = lessonId;
      } else if (displayPosition === 'business-featured') {
        layout.business[sortOrder] = lessonId;
      }
    }

    // 填充空槽位
    layout.dashboard = fillEmptySlots(layout.dashboard, SLOT_RATIOS.dashboard.length);
    layout.dailyCinema = fillEmptySlots(layout.dailyCinema, SLOT_RATIOS.dailyCinema.length);
    layout.cognitive = fillEmptySlots(layout.cognitive, SLOT_RATIOS.cognitive.length);
    layout.business = fillEmptySlots(layout.business, SLOT_RATIOS.business.length);

    return NextResponse.json({ 
      success: true,
      data: layout
    });

  } catch (error) {
    console.error('获取布局失败:', error);
    return NextResponse.json(
      { success: false, error: '获取布局失败' },
      { status: 500 }
    );
  }
}

// 辅助函数：填充空槽位
function fillEmptySlots(arr: string[], length: number): string[] {
  const result = new Array(length).fill('');
  for (let i = 0; i < arr.length && i < length; i++) {
    if (arr[i]) result[i] = arr[i];
  }
  return result;
}

// POST: 保存布局
export async function POST(request: NextRequest) {
  try {
    const layout: LayoutConfig = await request.json();

    // 更新每个课程的 Display_Position 和 Sort_Order
    const updates = [];

    // Dashboard
    for (let i = 0; i < layout.dashboard.length; i++) {
      const lessonId = layout.dashboard[i];
      if (lessonId) {
        const pageId = await getPageIdByLessonId(lessonId);
        if (pageId) {
          // 获取课程信息以判断是否为纯图片卡片
          const page = await notion.pages.retrieve({ page_id: pageId }) as any;
          const properties = page.properties;
          
          // 判断是否为纯图片卡片（没有视频URL和标题）
          const hasVideo = properties.Video_URL?.url;
          const hasTitle = properties.Title_CN?.rich_text?.[0]?.plain_text || properties.Title_EN?.rich_text?.[0]?.plain_text;
          const isImageCard = !hasVideo && !hasTitle;
          
          updates.push(
            notion.pages.update({
              page_id: pageId,
              properties: {
                Display_Position: { select: { name: 'dashboard-featured' } },
                Sort_Order: { number: i },
                Cover_Ratio: { select: { name: SLOT_RATIOS.dashboard[i] } },
                Content_Type: { select: { name: isImageCard ? 'image' : 'video' } }
              }
            })
          );
        }
      }
    }

    // Daily Cinema
    for (let i = 0; i < layout.dailyCinema.length; i++) {
      const lessonId = layout.dailyCinema[i];
      if (lessonId) {
        const pageId = await getPageIdByLessonId(lessonId);
        if (pageId) {
          const page = await notion.pages.retrieve({ page_id: pageId }) as any;
          const properties = page.properties;
          
          const hasVideo = properties.Video_URL?.url;
          const hasTitle = properties.Title_CN?.rich_text?.[0]?.plain_text || properties.Title_EN?.rich_text?.[0]?.plain_text;
          const isImageCard = !hasVideo && !hasTitle;
          
          updates.push(
            notion.pages.update({
              page_id: pageId,
              properties: {
                Display_Position: { select: { name: 'daily-cinema' } },
                Sort_Order: { number: i },
                Cover_Ratio: { select: { name: SLOT_RATIOS.dailyCinema[i] } },
                Content_Type: { select: { name: isImageCard ? 'image' : 'video' } }
              }
            })
          );
        }
      }
    }

    // Cognitive
    for (let i = 0; i < layout.cognitive.length; i++) {
      const lessonId = layout.cognitive[i];
      if (lessonId) {
        const pageId = await getPageIdByLessonId(lessonId);
        if (pageId) {
          const page = await notion.pages.retrieve({ page_id: pageId });
          const properties = (page as any).properties;
          
          const hasVideo = properties.Video_URL?.url;
          const hasTitle = properties.Title_CN?.rich_text?.[0]?.plain_text || properties.Title_EN?.rich_text?.[0]?.plain_text;
          const isImageCard = !hasVideo && !hasTitle;
          
          updates.push(
            notion.pages.update({
              page_id: pageId,
              properties: {
                Display_Position: { select: { name: 'cognitive-featured' } },
                Sort_Order: { number: i },
                Cover_Ratio: { select: { name: SLOT_RATIOS.cognitive[i] } },
                Content_Type: { select: { name: isImageCard ? 'image' : 'video' } }
              }
            })
          );
        }
      }
    }

    // Business
    for (let i = 0; i < layout.business.length; i++) {
      const lessonId = layout.business[i];
      if (lessonId) {
        const pageId = await getPageIdByLessonId(lessonId);
        if (pageId) {
          const page = await notion.pages.retrieve({ page_id: pageId });
          const properties = (page as any).properties;
          
          const hasVideo = properties.Video_URL?.url;
          const hasTitle = properties.Title_CN?.rich_text?.[0]?.plain_text || properties.Title_EN?.rich_text?.[0]?.plain_text;
          const isImageCard = !hasVideo && !hasTitle;
          
          updates.push(
            notion.pages.update({
              page_id: pageId,
              properties: {
                Display_Position: { select: { name: 'business-featured' } },
                Sort_Order: { number: i },
                Cover_Ratio: { select: { name: SLOT_RATIOS.business[i] } },
                Content_Type: { select: { name: isImageCard ? 'image' : 'video' } }
              }
            })
          );
        }
      }
    }

    // 批量执行更新
    await Promise.all(updates);

    return NextResponse.json({ 
      success: true,
      message: `已更新 ${updates.length} 个课程的布局信息`
    });

  } catch (error) {
    console.error('保存布局失败:', error);
    return NextResponse.json(
      { success: false, error: '保存布局失败' },
      { status: 500 }
    );
  }
}



