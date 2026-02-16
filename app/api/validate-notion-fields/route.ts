// ============================================================
// API Route: Notion 字段验证 - 检查字段配置是否正确
// ============================================================

import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

export async function GET() {
  try {
    const lessonsDbId = process.env.NOTION_DB_LESSONS || '';
    
    if (!lessonsDbId) {
      return NextResponse.json({
        success: false,
        error: '未配置 NOTION_DB_LESSONS 环境变量'
      }, { status: 500 });
    }

    // 获取数据库结构
    const database = await notion.databases.retrieve({
      database_id: lessonsDbId,
    });

    // 提取所有字段名称和类型
    const properties: any = database.properties;
    const fields = Object.keys(properties).map(key => ({
      name: key,
      type: properties[key].type,
      id: properties[key].id,
    }));

    // 检查必需字段
    const requiredFields = [
      { name: 'Lesson_ID', type: 'title' },
      { name: 'Category', type: 'select' },
      { name: 'EP', type: 'rich_text' },  // 应该是 Text 类型
      { name: 'Title_CN', type: 'rich_text' },
      { name: 'Title_EN', type: 'rich_text' },
      { name: 'Status', type: 'select' },
      { name: 'Date', type: 'date' },
      { name: 'Cover_Img', type: 'url' },
      { name: 'Cover_Img_16x9', type: 'url' },
      { name: 'Cover_Ratio', type: 'select' },
      { name: 'Video_URL', type: 'url' },
      { name: 'SRT_Raw', type: 'rich_text' },
      { name: 'Content_Type', type: 'select' },
      { name: 'Display_Position', type: 'select' },
      { name: 'Sort_Order', type: 'number' },
    ];

    const missingFields = [];
    const wrongTypeFields = [];

    for (const required of requiredFields) {
      const field = fields.find(f => f.name === required.name);
      
      if (!field) {
        missingFields.push(required.name);
      } else if (field.type !== required.type) {
        wrongTypeFields.push({
          name: required.name,
          expected: required.type,
          actual: field.type,
        });
      }
    }

    // 检查 Display_Position 的选项
    let displayPositionOptions: string[] = [];
    if (properties.Display_Position?.select?.options) {
      displayPositionOptions = properties.Display_Position.select.options.map((opt: any) => opt.name);
    }

    // 检查 Cover_Ratio 的选项
    let coverRatioOptions: string[] = [];
    if (properties.Cover_Ratio?.select?.options) {
      coverRatioOptions = properties.Cover_Ratio.select.options.map((opt: any) => opt.name);
    }

    const isValid = missingFields.length === 0 && wrongTypeFields.length === 0;

    return NextResponse.json({
      success: true,
      isValid,
      database: {
        id: lessonsDbId,
        title: (database as any).title?.[0]?.plain_text || 'Lessons',
      },
      fields: {
        total: fields.length,
        list: fields,
      },
      validation: {
        missingFields,
        wrongTypeFields,
        displayPositionOptions,
        coverRatioOptions,
      },
      recommendations: isValid 
        ? ['✅ 所有字段配置正确！']
        : [
            ...missingFields.map(f => `❌ 缺少字段: ${f}`),
            ...wrongTypeFields.map(f => `⚠️ 字段类型错误: ${f.name} (期望: ${f.expected}, 实际: ${f.actual})`),
          ],
    });

  } catch (error) {
    console.error('Notion 字段验证失败:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '验证失败',
      details: error instanceof Error ? error.stack : String(error),
    }, { status: 500 });
  }
}


