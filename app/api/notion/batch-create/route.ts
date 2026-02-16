// ============================================================
// Notion 批量写入 API
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@notionhq/client';
import type { AIGeneratedContent } from '@/data/types';

// 初始化 Notion 客户端
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

// Notion 数据库 ID
const DATABASES = {
  lessons: process.env.NOTION_DB_LESSONS || '',
  vocabulary: process.env.NOTION_DB_VOCABULARY || '',
  grammar: process.env.NOTION_DB_GRAMMAR || '',
  recall: process.env.NOTION_DB_RECALL || '',
};

// ============================================================
// 辅助函数：获取 Lesson Page ID
// ============================================================

async function getLessonPageId(lessonId: string): Promise<string | null> {
  try {
    const response = await notion.databases.query({
      database_id: DATABASES.lessons,
      filter: {
        property: 'ID',
        title: {
          equals: lessonId
        }
      }
    });
    
    return response.results[0]?.id || null;
  } catch (error) {
    console.error('获取 Lesson Page ID 失败:', error);
    return null;
  }
}

// ============================================================
// POST 处理函数
// ============================================================

export async function POST(request: NextRequest) {
  try {
    // 检查 API Key
    if (!process.env.NOTION_API_KEY) {
      return NextResponse.json(
        { success: false, error: '未配置 NOTION_API_KEY' },
        { status: 500 }
      );
    }

    // 解析请求
    const body: { lessonId: string; content: AIGeneratedContent } = await request.json();
    const { lessonId, content } = body;

    if (!lessonId || !content) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }

    console.log('📝 开始写入 Notion...');
    console.log('📚 Lesson ID:', lessonId);

    // 1. 获取 Lesson Page ID
    const lessonPageId = await getLessonPageId(lessonId);
    
    if (!lessonPageId) {
      return NextResponse.json(
        { success: false, error: `找不到课程: ${lessonId}` },
        { status: 404 }
      );
    }

    console.log('✅ 找到课程 Page ID:', lessonPageId);

    // 2. 写入 Vocabulary
    console.log('📚 写入词汇...');
    for (const vocab of content.vocabulary) {
      await notion.pages.create({
        parent: { database_id: DATABASES.vocabulary },
        properties: {
          Word: { title: [{ text: { content: vocab.word } }] },
          Phonetic: { rich_text: [{ text: { content: vocab.phonetic } }] },
          Definition: { rich_text: [{ text: { content: vocab.definition } }] },
          Definition_CN: { rich_text: [{ text: { content: vocab.definition_cn } }] },
          Example: { rich_text: [{ text: { content: vocab.example } }] },
          Order: { number: vocab.order },
          Lesson_ID: { relation: [{ id: lessonPageId }] },
        },
      });
    }
    console.log(`✅ 已写入 ${content.vocabulary.length} 个词汇`);

    // 3. 写入 Grammar
    console.log('📖 写入语法...');
    for (const grammar of content.grammar) {
      await notion.pages.create({
        parent: { database_id: DATABASES.grammar },
        properties: {
          Point: { title: [{ text: { content: grammar.point } }] },
          Description: { rich_text: [{ text: { content: grammar.description } }] },
          Example: { rich_text: [{ text: { content: grammar.example } }] },
          Timestamp: { number: grammar.timestamp },
          Order: { number: grammar.order },
          Lesson_ID: { relation: [{ id: lessonPageId }] },
        },
      });
    }
    console.log(`✅ 已写入 ${content.grammar.length} 个语法点`);

    // 4. 写入 Recall
    if (content.recall.text_en && content.recall.text_cn) {
      console.log('🔄 写入回译...');
      await notion.pages.create({
        parent: { database_id: DATABASES.recall },
        properties: {
          Text_CN: { title: [{ text: { content: content.recall.text_cn } }] },
          Text_EN: { rich_text: [{ text: { content: content.recall.text_en } }] },
          Lesson_ID: { relation: [{ id: lessonPageId }] },
        },
      });
      console.log('✅ 已写入回译');
    }

    console.log('🎉 全部写入完成！');

    return NextResponse.json({
      success: true,
      message: '内容已成功写入 Notion',
      stats: {
        vocabulary: content.vocabulary.length,
        grammar: content.grammar.length,
        recall: content.recall.text_en ? 1 : 0,
      }
    });

  } catch (error) {
    console.error('❌ 写入 Notion 失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '未知错误' 
      },
      { status: 500 }
    );
  }
}

