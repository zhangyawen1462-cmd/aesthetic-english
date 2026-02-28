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

    // 收集所有需要更新的 lessonId
    const allLessonIds = [
      ...layout.dashboard.filter(id => id),
      ...layout.dailyCinema.filter(id => id),
      ...layout.cognitive.filter(id => id),
      ...layout.business.filter(id => id),
    ];

    // 批量查询所有课程的 Page ID
    const lessonIdToPageId = new Map<string, string>();
    
    for (const lessonId of allLessonIds) {
      const pageId = await getPageIdByLessonId(lessonId);
      if (pageId) {
        lessonIdToPageId.set(lessonId, pageId);
      }
    }

    // 查询所有旧布局（用于后续清理）
    const existingResponse = await notion.databases.query({
      database_id: DATABASE_ID,
      filter: {
        or: [
          { property: 'Display_Position', select: { equals: 'dashboard-featured' } },
          { property: 'Display_Position', select: { equals: 'daily-cinema' } },
          { property: 'Display_Position', select: { equals: 'cognitive-featured' } },
          { property: 'Display_Position', select: { equals: 'business-featured' } }
        ]
      }
    });

    // 构建所有更新操作
    const updates: Promise<any>[] = [];

    // Dashboard
    layout.dashboard.forEach((lessonId, index) => {
      if (lessonId && lessonIdToPageId.has(lessonId)) {
        const pageId = lessonIdToPageId.get(lessonId)!;
        updates.push(
          notion.pages.update({
            page_id: pageId,
            properties: {
              Display_Position: { select: { name: 'dashboard-featured' } },
              Sort_Order: { number: index }
            }
          })
        );
      }
    });

    // Daily Cinema
    layout.dailyCinema.forEach((lessonId, index) => {
      if (lessonId && lessonIdToPageId.has(lessonId)) {
        const pageId = lessonIdToPageId.get(lessonId)!;
        updates.push(
          notion.pages.update({
            page_id: pageId,
            properties: {
              Display_Position: { select: { name: 'daily-cinema' } },
              Sort_Order: { number: index }
            }
          })
        );
      }
    });

    // Cognitive
    layout.cognitive.forEach((lessonId, index) => {
      if (lessonId && lessonIdToPageId.has(lessonId)) {
        const pageId = lessonIdToPageId.get(lessonId)!;
        updates.push(
          notion.pages.update({
            page_id: pageId,
            properties: {
              Display_Position: { select: { name: 'cognitive-featured' } },
              Sort_Order: { number: index }
            }
          })
        );
      }
    });

    // Business
    layout.business.forEach((lessonId, index) => {
      if (lessonId && lessonIdToPageId.has(lessonId)) {
        const pageId = lessonIdToPageId.get(lessonId)!;
        updates.push(
          notion.pages.update({
            page_id: pageId,
            properties: {
              Display_Position: { select: { name: 'business-featured' } },
              Sort_Order: { number: index }
            }
          })
        );
      }
    });

    // 批量执行所有更新
    const results = await Promise.allSettled(updates);
    
    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    // 处理需要移回 available-pool 的课程
    const currentLayoutIds = new Set(allLessonIds);
    const toRemove = existingResponse.results.filter(page => {
      if (!('properties' in page)) return false;
      const props = page.properties as any;
      const lessonId = props.Lesson_ID?.title?.[0]?.plain_text || '';
      return lessonId && !currentLayoutIds.has(lessonId);
    });

    if (toRemove.length > 0) {
      const removeUpdates = toRemove.map(page => 
        notion.pages.update({
          page_id: page.id,
          properties: {
            Display_Position: { select: { name: 'available-pool' } },
            Sort_Order: { number: 0 }
          }
        })
      );
      await Promise.all(removeUpdates);
    }

    return NextResponse.json({ 
      success: true,
      message: `布局保存完成！更新 ${succeeded} 个，移回 ${toRemove.length} 个`,
      updated: succeeded,
      removed: toRemove.length,
      failed
    });

  } catch (error) {
    console.error('保存布局失败:', error);
    return NextResponse.json(
      { success: false, error: '保存布局失败' },
      { status: 500 }
    );
  }
}



