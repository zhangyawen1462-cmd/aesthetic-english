import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const DATABASE_ID = process.env.NOTION_DB_LESSONS!;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category'); // daily, cognitive, business, 或 null（全部）

    // 构建过滤条件
    const filter: any = {
      and: [
        {
          property: 'Status',
          select: {
            equals: 'Published'
          }
        }
      ]
    };

    // 如果指定了分类，添加分类过滤
    if (category && category !== 'all') {
      filter.and.push({
        property: 'Category',
        select: {
          equals: category
        }
      });
    }

    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      filter,
      sorts: [
        {
          property: 'Date',
          direction: 'descending'
        }
      ]
    });

    const lessons = response.results.map((page: any) => {
      const props = page.properties;
      
      return {
        id: props.Lesson_ID?.title?.[0]?.text?.content || '',
        category: props.Category?.select?.name || '',
        titleCn: props.Title_CN?.rich_text?.[0]?.text?.content || '',
        titleEn: props.Title_EN?.rich_text?.[0]?.text?.content || '',
        subtitle: props.Subtitle?.rich_text?.[0]?.text?.content || '',
        ep: props.EP?.rich_text?.[0]?.text?.content || '',
        coverImg: props.Cover_Img?.url || '',
        coverImg16x9: props.Cover_Img_16x9?.url || props.Cover_Img?.url || '', // 回退到精选封面
        videoUrl: props.Video_URL?.url || '',
        date: props.Date?.date?.start || '',
        displayPosition: props.Display_Position?.select?.name || '',
        sortOrder: props.Sort_Order?.number || 0
      };
    });

    return NextResponse.json({
      success: true,
      data: lessons,
      count: lessons.length
    });

  } catch (error) {
    console.error('Archives API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch archives' },
      { status: 500 }
    );
  }
}






