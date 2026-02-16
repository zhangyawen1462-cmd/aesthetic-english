// ============================================================
// API Route: 一站式发布 - 整合上传、AI生成、Notion创建
// ============================================================

import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';
import { NOTION_FIELDS } from './notion-fields.config';
import { uploadToOSS } from '@/lib/oss-client';

// 初始化 Notion 客户端
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const DATABASES = {
  lessons: process.env.NOTION_DB_LESSONS || '',
  vocabulary: process.env.NOTION_DB_VOCABULARY || '',
  grammar: process.env.NOTION_DB_GRAMMAR || '',
  recall: process.env.NOTION_DB_RECALL || '',
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    // 1. 获取表单数据
    const lessonId = formData.get('lessonId') as string;
    const titleEn = formData.get('titleEn') as string;
    const titleCn = formData.get('titleCn') as string;
    const category = formData.get('category') as string;
    const ep = formData.get('ep') as string;
    const contentType = formData.get('contentType') as string; // 'video' | 'image'
    const publishTarget = formData.get('publishTarget') as string; // 'featured' | 'archive-only'
    
    const coverFeaturedFile = formData.get('coverFeatured') as File | null;  // 精选封面
    const coverArchiveFile = formData.get('coverArchive') as File | null;    // 归档封面
    const videoFile = formData.get('video') as File | null;
    const srtFile = formData.get('srt') as File | null;

    // 验证必填字段
    if (!lessonId) {
      return NextResponse.json(
        { success: false, error: '缺少 Lesson ID' },
        { status: 400 }
      );
    }

    // 视频课程需要完整信息
    if (contentType === 'video') {
      if (!titleEn || !titleCn || !category || !ep) {
        return NextResponse.json(
          { success: false, error: '视频课程需要完整的标题、分类和期数信息' },
          { status: 400 }
        );
      }
      if (!srtFile) {
        return NextResponse.json(
          { success: false, error: '视频课程需要上传 SRT 字幕文件' },
          { status: 400 }
        );
      }
    }

    // 纯图片需要封面
    if (contentType === 'image' && !coverFeaturedFile) {
      return NextResponse.json(
        { success: false, error: '纯图片模式需要上传封面图片' },
        { status: 400 }
      );
    }

    // 视频课程需要归档封面（如果要进入 Archives）
    // 暂时改为可选，因为 Notion 中可能还没有 Cover_Img_16x9 字段
    // if (contentType === 'video' && !coverArchiveFile) {
    //   return NextResponse.json(
    //     { success: false, error: '视频课程需要上传归档封面（16:9，用于 Archives）' },
    //     { status: 400 }
    //   );
    // }

    // 精选视频需要精选封面
    if (contentType === 'video' && publishTarget === 'featured' && !coverFeaturedFile) {
      return NextResponse.json(
        { success: false, error: '精选视频需要上传精选封面（用于 Dashboard/Daily Cinema）' },
        { status: 400 }
      );
    }

    // 2. 上传文件到 OSS（如果有）
    let coverFeaturedUrl = '';
    let coverArchiveUrl = '';
    let videoUrl = '';

    if (coverFeaturedFile) {
      coverFeaturedUrl = await uploadToOSS(coverFeaturedFile, 'images');
    }

    if (coverArchiveFile) {
      coverArchiveUrl = await uploadToOSS(coverArchiveFile, 'images');
    }

    if (videoFile) {
      videoUrl = await uploadToOSS(videoFile, 'videos');
    }

    // 3. 处理 AI 生成内容（仅视频课程）
    let aiContent = {
      vocabulary: [],
      grammar: [],
      recall: { text_cn: '', text_en: '' }
    };

    if (contentType === 'video' && srtFile) {
      const srtContent = await srtFile.text();
      aiContent = await generateContentWithDeepSeek(srtContent, lessonId);
    }

    // 4. 创建 Notion 课程页面
    const notionProperties: any = {
      [NOTION_FIELDS.LESSON.ID]: {
        title: [{ text: { content: lessonId } }]
      },
      [NOTION_FIELDS.LESSON.STATUS]: {
        select: { name: 'Published' }  // 直接设为 Published，立即可见
      },
      [NOTION_FIELDS.LESSON.DATE]: {
        date: { start: new Date().toISOString().split('T')[0] }
      }
    };

    // 视频课程的完整信息
    if (contentType === 'video') {
      notionProperties[NOTION_FIELDS.LESSON.TITLE_EN] = {
        rich_text: [{ text: { content: titleEn } }]
      };
      notionProperties[NOTION_FIELDS.LESSON.TITLE_CN] = {
        rich_text: [{ text: { content: titleCn } }]
      };
      notionProperties[NOTION_FIELDS.LESSON.CATEGORY] = {
        select: { name: category }
      };
      notionProperties[NOTION_FIELDS.LESSON.EP] = {
        rich_text: [{ text: { content: ep } }]
      };
      
      // 设置 Display_Position
      if (publishTarget === 'archive-only') {
        notionProperties[NOTION_FIELDS.LESSON.DISPLAY_POSITION] = {
          select: { name: 'available-pool' }  // 改为 available-pool，可以在布局管理器中使用
        };
      } else if (publishTarget === 'featured') {
        // 根据 category 自动设置对应的精选位置
        const displayPositionMap: Record<string, string> = {
          'daily': 'daily-cinema',
          'cognitive': 'cognitive-featured',
          'business': 'business-featured'
        };
        notionProperties[NOTION_FIELDS.LESSON.DISPLAY_POSITION] = {
          select: { name: displayPositionMap[category] || 'available-pool' }
        };
      }
    }

    // 设置 Content_Type（video 或 image）
      notionProperties[NOTION_FIELDS.LESSON.CONTENT_TYPE] = {
      select: { name: contentType }  // 'video' 或 'image'
      };

    // 添加 URL
    if (coverFeaturedUrl) {
      notionProperties[NOTION_FIELDS.LESSON.COVER_IMG] = {
        url: coverFeaturedUrl
      };
    }

    // 归档封面（16:9，用于 Archives）
    if (coverArchiveUrl) {
      notionProperties[NOTION_FIELDS.LESSON.COVER_IMG_16X9] = {
        url: coverArchiveUrl
      };
    }

    if (videoUrl) {
      notionProperties[NOTION_FIELDS.LESSON.VIDEO_URL] = {
        url: videoUrl
      };
    }

    // 添加 SRT 原始内容（用于 Script 模块）
    if (contentType === 'video' && srtFile) {
      const srtContent = await srtFile.text();
      notionProperties[NOTION_FIELDS.LESSON.SRT_RAW] = {
        rich_text: [{ text: { content: srtContent.substring(0, 2000) } }]  // Notion 限制 2000 字符
      };
    }

    const lessonPage = await notion.pages.create({
      parent: { database_id: DATABASES.lessons },
      properties: notionProperties
    });

    // 5. 批量创建词汇、语法、回译数据（仅视频课程）
    const promises = [];

    if (contentType === 'video') {
      // 创建词汇
      if (DATABASES.vocabulary && aiContent.vocabulary.length > 0) {
        for (const vocab of aiContent.vocabulary) {
          promises.push(
            notion.pages.create({
              parent: { database_id: DATABASES.vocabulary },
              properties: {
                [NOTION_FIELDS.VOCABULARY.WORD]: {
                  title: [{ text: { content: vocab.word } }]
                },
                [NOTION_FIELDS.VOCABULARY.PHONETIC]: {
                  rich_text: [{ text: { content: vocab.phonetic } }]
                },
                [NOTION_FIELDS.VOCABULARY.DEFINITION]: {
                  rich_text: [{ text: { content: vocab.definition } }]
                },
                [NOTION_FIELDS.VOCABULARY.DEFINITION_CN]: {
                  rich_text: [{ text: { content: vocab.definition_cn } }]
                },
                [NOTION_FIELDS.VOCABULARY.EXAMPLE]: {
                  rich_text: [{ text: { content: vocab.example } }]
                },
                // Source 字段暂时注释掉，等 Notion 添加后再启用
                // [NOTION_FIELDS.VOCABULARY.SOURCE]: {
                //   rich_text: [{ text: { content: vocab.source || 'Oxford' } }]
                // },
                [NOTION_FIELDS.VOCABULARY.LESSON]: {
                  relation: [{ id: lessonPage.id }]
                }
              }
            })
          );
        }
      }

      // 创建语法
      if (DATABASES.grammar && aiContent.grammar.length > 0) {
        for (const grammar of aiContent.grammar) {
          promises.push(
            notion.pages.create({
              parent: { database_id: DATABASES.grammar },
              properties: {
                [NOTION_FIELDS.GRAMMAR.POINT]: {
                  title: [{ text: { content: grammar.point } }]
                },
                [NOTION_FIELDS.GRAMMAR.DESCRIPTION]: {
                  rich_text: [{ text: { content: grammar.description } }]
                },
                [NOTION_FIELDS.GRAMMAR.EXAMPLE]: {
                  rich_text: [{ text: { content: grammar.example } }]
                },
                [NOTION_FIELDS.GRAMMAR.LESSON]: {
                  relation: [{ id: lessonPage.id }]
                }
              }
            })
          );
        }
      }

      // 创建回译
      if (DATABASES.recall && aiContent.recall.text_en) {
        promises.push(
          notion.pages.create({
            parent: { database_id: DATABASES.recall },
            properties: {
              [NOTION_FIELDS.RECALL.TEXT_CN]: {
                title: [{ text: { content: aiContent.recall.text_cn } }]
              },
              [NOTION_FIELDS.RECALL.TEXT_EN]: {
                rich_text: [{ text: { content: aiContent.recall.text_en } }]
              },
              [NOTION_FIELDS.RECALL.LESSON]: {
                relation: [{ id: lessonPage.id }]
              }
            }
          })
        );
      }

      await Promise.all(promises);
    }

    // 6. 返回成功（包含 AI 生成状态）
    const baseMessage = contentType === 'image' 
      ? '图片上传成功！请前往布局管理器排版' 
      : publishTarget === 'archive-only'
      ? '发布成功！已直接发布到 Archives'
      : '上传成功！请前往布局管理器排版';
    
    const aiWarning = (aiContent as any).aiGenerationFailed 
      ? ' ⚠️ 注意：AI 内容生成失败，请手动添加词汇和语法内容。' 
      : '';

    return NextResponse.json({
      success: true,
      message: baseMessage + aiWarning,
      notionUrl: lessonPage.url,
      lessonId: lessonId,
      contentType: contentType,
      publishTarget: publishTarget,
      aiGenerationFailed: (aiContent as any).aiGenerationFailed || false,
      aiError: (aiContent as any).aiError,
      data: {
        coverFeaturedUrl,
        coverArchiveUrl,
        videoUrl,
        vocabularyCount: aiContent.vocabulary.length,
        grammarCount: aiContent.grammar.length,
        hasRecall: !!aiContent.recall.text_en
      }
    });

  } catch (error) {
    console.error('Publish API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '发布失败',
        details: error instanceof Error ? error.stack : String(error)
      },
      { status: 500 }
    );
  }
}

// OSS 上传功能已移至 lib/oss-client.ts

// ============================================================
// 辅助函数：调用 DeepSeek AI 生成内容
// ============================================================

async function generateContentWithDeepSeek(srtContent: string, lessonId: string) {
  const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

  if (!DEEPSEEK_API_KEY) {
    throw new Error('未配置 DEEPSEEK_API_KEY');
  }

  const prompt = `你是一位专业的英语教学内容生成助手。请根据以下 SRT 字幕内容，生成高质量的学习材料。

SRT 字幕内容：
${srtContent}

请生成以下内容（以 JSON 格式返回）：

1. **vocabulary**: 5-8个核心词汇，每个包含：
   - word: 单词
   - phonetic: 音标（英式或美式）
   - definition: 英文释义
   - definition_cn: **中文释义**（必须是纯中文解释，不要包含英文）
   - example: 例句（最好来自字幕中）
   
   **注意**：词汇解释必须准确，请参考权威词典（如 Oxford、Collins、Longman 等），但不要在释义中标注来源。

2. **grammar**: 3-5个语法点，每个包含：
   - point: 语法点名称（中文+英文，格式：中文名称 English Name，不要括号）
   - description: **中文详细说明**（必须是纯中文解释，清晰易懂）
   - example: **英文例句**（最好来自字幕中，展示该语法点的用法）

3. **recall**: 回译练习（完整全文提取），包含：
   - text_cn: 将字幕中的所有英文内容翻译成一个完整的中文段落（保持原文的完整性和连贯性，不要省略任何内容）
   - text_en: 字幕中的完整英文原文（整合成一个连贯的段落，去除时间戳和序号）

**重要**: 
- vocabulary 的 definition_cn 必须是纯中文
- grammar 的 point 格式为"中文 English"（不要括号），description 必须是纯中文，example 必须是英文
- recall 部分必须包含视频的完整内容，不是摘要或节选

请确保内容准确、实用、适合中高级英语学习者。

返回格式：
\`\`\`json
{
  "vocabulary": [...],
  "grammar": [...],
  "recall": { 
    "text_cn": "完整的中文段落...", 
    "text_en": "完整的英文段落..." 
  }
}
\`\`\``;

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: '你是一位专业的英语教学内容生成助手，擅长从视频字幕中提取学习要点和完整文本。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,  // 增加到 4000，以支持完整文本
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API 错误: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // 提取 JSON（处理可能的 markdown 代码块）
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AI 返回格式错误');
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0];
    const result = JSON.parse(jsonStr);

    return {
      vocabulary: result.vocabulary || [],
      grammar: result.grammar || [],
      recall: result.recall || { text_cn: '', text_en: '' }
    };

  } catch (error) {
    console.error('DeepSeek API Error:', error);
    
    // 返回空数据并标记 AI 生成失败
    return {
      vocabulary: [],
      grammar: [],
      recall: { text_cn: '', text_en: '' },
      aiGenerationFailed: true,
      aiError: error instanceof Error ? error.message : 'AI 生成失败'
    };
  }
}

