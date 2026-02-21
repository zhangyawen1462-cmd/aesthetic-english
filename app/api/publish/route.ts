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
        select: { name: 'Draft' }  // 先设为 Draft，审核后再改为 Published
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

    // 添加 SRT 原始内容（用于 Script 模块）- 分块存储以突破 2000 字符限制
    if (contentType === 'video' && srtFile) {
      const srtContent = await srtFile.text();
      const chunks = [];
      for (let i = 0; i < srtContent.length; i += 2000) {
        chunks.push({ text: { content: srtContent.substring(i, i + 2000) } });
      }
      notionProperties[NOTION_FIELDS.LESSON.SRT_RAW] = {
        rich_text: chunks
      };
    }

    const lessonPage = await notion.pages.create({
      parent: { database_id: DATABASES.lessons },
      properties: notionProperties
    });
    
    const lessonPageId = lessonPage.id;
    const lessonPageUrl = (lessonPage as any).url;

    // 5. 批量创建词汇、语法、回译数据（仅视频课程）
    const promises = [];

    if (contentType === 'video') {
      // 创建词汇（验证数据完整性）
      if (DATABASES.vocabulary && aiContent.vocabulary.length > 0) {
        for (const vocab of aiContent.vocabulary) {
          const v = vocab as any;
          
          // 验证必填字段，跳过不完整的数据
          if (!v.word || !v.phonetic || !v.definition || !v.definition_cn || !v.example) {
            console.warn('跳过不完整的词汇数据:', v);
            continue;
          }
          
          promises.push(
            notion.pages.create({
              parent: { database_id: DATABASES.vocabulary },
              properties: {
                [NOTION_FIELDS.VOCABULARY.WORD]: {
                  title: [{ text: { content: v.word || '' } }]
                },
                [NOTION_FIELDS.VOCABULARY.PHONETIC]: {
                  rich_text: [{ text: { content: v.phonetic || '' } }]
                },
                [NOTION_FIELDS.VOCABULARY.DEFINITION]: {
                  rich_text: [{ text: { content: v.definition || '' } }]
                },
                [NOTION_FIELDS.VOCABULARY.DEFINITION_CN]: {
                  rich_text: [{ text: { content: v.definition_cn || '' } }]
                },
                [NOTION_FIELDS.VOCABULARY.EXAMPLE]: {
                  rich_text: [{ text: { content: v.example || '' } }]
                },
                // Source 字段暂时注释掉，等 Notion 添加后再启用
                // [NOTION_FIELDS.VOCABULARY.SOURCE]: {
                //   rich_text: [{ text: { content: vocab.source || 'Oxford' } }]
                // },
                [NOTION_FIELDS.VOCABULARY.LESSON]: {
                  relation: [{ id: lessonPageId }]
                }
              }
            })
          );
        }
      }

      // 创建语法（验证数据完整性）
      if (DATABASES.grammar && aiContent.grammar.length > 0) {
        for (const grammar of aiContent.grammar) {
          const g = grammar as any;
          
          // 验证必填字段，跳过不完整的数据
          if (!g.point || !g.description || !g.example) {
            console.warn('跳过不完整的语法数据:', g);
            continue;
          }
          
          promises.push(
            notion.pages.create({
              parent: { database_id: DATABASES.grammar },
              properties: {
                [NOTION_FIELDS.GRAMMAR.POINT]: {
                  title: [{ text: { content: g.point || '' } }]
                },
                [NOTION_FIELDS.GRAMMAR.DESCRIPTION]: {
                  rich_text: [{ text: { content: g.description || '' } }]
                },
                [NOTION_FIELDS.GRAMMAR.EXAMPLE]: {
                  rich_text: [{ text: { content: g.example || '' } }]
                },
                [NOTION_FIELDS.GRAMMAR.LESSON]: {
                  relation: [{ id: lessonPageId }]
                }
              }
            })
          );
        }
      }

      // 创建回译（验证数据完整性）- 分块存储以突破 2000 字符限制
      if (DATABASES.recall && aiContent.recall.text_en && aiContent.recall.text_cn) {
        // 中文标题分块（title 字段限制 2000 字符）
        const textCnChunks = [];
        const textCn = aiContent.recall.text_cn;
        for (let i = 0; i < textCn.length; i += 2000) {
          textCnChunks.push({ text: { content: textCn.substring(i, i + 2000) } });
        }
        
        // 英文内容分块（rich_text 字段限制 2000 字符）
        const textEnChunks = [];
        const textEn = aiContent.recall.text_en;
        for (let i = 0; i < textEn.length; i += 2000) {
          textEnChunks.push({ text: { content: textEn.substring(i, i + 2000) } });
        }
        
        promises.push(
          notion.pages.create({
            parent: { database_id: DATABASES.recall },
            properties: {
              [NOTION_FIELDS.RECALL.TEXT_CN]: {
                title: textCnChunks
              },
              [NOTION_FIELDS.RECALL.TEXT_EN]: {
                rich_text: textEnChunks
              },
              [NOTION_FIELDS.RECALL.LESSON]: {
                relation: [{ id: lessonPageId }]
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
      notionUrl: lessonPageUrl,
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
// 辅助函数：智能截取 SRT 字幕（保留最重要的部分）
// ============================================================

function extractKeySRT(srtContent: string, maxLength: number = 3000): string {
  if (!srtContent) return '';
  
  // 如果内容本身不长，直接返回
  if (srtContent.length <= maxLength) {
    return srtContent;
  }
  
  console.log(`📝 SRT 过长 (${srtContent.length} 字符)，开始智能截取...`);
  
  // 移除时间戳和序号，只保留文本内容
  const lines = srtContent.split('\n');
  const textLines: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // 跳过序号行和时间戳行
    if (line && !line.match(/^\d+$/) && !line.match(/\d{2}:\d{2}:\d{2}/)) {
      textLines.push(line);
    }
  }
  
  const fullText = textLines.join(' ');
  
  // 如果处理后的文本还是太长，按句子智能截取
  if (fullText.length > maxLength) {
    const sentences = fullText.split(/[.!?。！？]+/).filter(s => s.trim().length > 0);
    
    if (sentences.length === 0) return fullText.slice(0, maxLength);
    
    // 策略：取开头 40% + 结尾 40% + 中间 20%
    const totalSentences = sentences.length;
    const headCount = Math.ceil(totalSentences * 0.4);
    const tailCount = Math.ceil(totalSentences * 0.4);
    const midCount = Math.max(1, totalSentences - headCount - tailCount);
    
    const headSentences = sentences.slice(0, headCount);
    const tailSentences = sentences.slice(-tailCount);
    const midStart = Math.floor((totalSentences - midCount) / 2);
    const midSentences = sentences.slice(midStart, midStart + midCount);
    
    // 组合关键句子
    const keySentences = [...headSentences, ...midSentences, ...tailSentences];
    let result = keySentences.join('. ').trim();
    
    // 如果还是太长，直接截断
    if (result.length > maxLength) {
      result = result.slice(0, maxLength) + '...';
    }
    
    console.log(`✅ SRT 截取完成: ${srtContent.length} → ${result.length} 字符`);
    return result;
  }
  
  return fullText;
}

// ============================================================
// 辅助函数：调用 DeepSeek AI 生成内容
// ============================================================

async function generateContentWithDeepSeek(srtContent: string, lessonId: string) {
  const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

  if (!DEEPSEEK_API_KEY) {
    throw new Error('未配置 DEEPSEEK_API_KEY');
  }

  // 🎯 智能截取 SRT 内容（控制在 3000 字符以内）
  const processedSRT = extractKeySRT(srtContent, 3000);

  const prompt = `你是一位专业的英语教学内容生成助手。请根据以下 SRT 字幕内容，生成高质量的学习材料。

SRT 字幕内容：
${processedSRT}

请生成以下内容（以 JSON 格式返回）：

1. **vocabulary**: 不限数量，提取所有四级以上难度的核心词汇（包括六级、雅思、托福词汇），以及有价值的短语和搭配，每个包含：
   - word: 单词或短语
   - phonetic: 音标（英式或美式）
   - definition: 英文释义
   - definition_cn: **中文释义**（必须是纯中文解释，不要包含英文）
   - example: 例句（最好来自字幕中）
   
   **注意**：词汇解释必须准确，请参考权威词典（如 Oxford、Collins、Longman 等），但不要在释义中标注来源。

2. **grammar**: 3-5个语法点，每个包含：
   - point: 语法点名称（中文+英文，格式：中文名称 English Name，不要括号）
   - description: **中文详细说明**（必须是纯中文解释，清晰易懂）
   - example: **英文例句**（最好来自字幕中，展示该语法点的用法）

3. **recall**: 回译练习（基于提供的字幕内容），包含：
   - text_cn: 将字幕中的英文内容翻译成一个完整的中文段落。如果内容超过200字符，请分段处理，每段开头缩进2个中文字符（使用全角空格"　　"），段落之间用换行分隔。保持原文的完整性和连贯性。
   - text_en: 字幕中的英文原文（整合成一个连贯的段落）。如果内容超过200字符，请分段处理，每段开头缩进2个英文字符（使用2个空格"  "），段落之间用换行分隔。去除时间戳和序号，保持内容完整。

**重要**: 
- vocabulary 不限数量，只要是四级以上难度或有学习价值的词汇/短语都要提取
- vocabulary 的 definition_cn 必须是纯中文
- grammar 的 point 格式为"中文 English"（不要括号），description 必须是纯中文，example 必须是英文
- recall 部分基于提供的字幕内容生成，保持完整性
- recall 的长文本要分段，段首缩进2字符（中文用全角空格"　　"，英文用2个空格"  "）

请确保内容准确、实用、适合中高级英语学习者。

返回格式：
\`\`\`json
{
  "vocabulary": [...],
  "grammar": [...],
  "recall": { 
    "text_cn": "　　完整的中文段落第一段...\n　　完整的中文段落第二段...", 
    "text_en": "  Complete English paragraph one...\n  Complete English paragraph two..." 
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
        max_tokens: 8192,  // DeepSeek 最大支持 8192
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API 错误响应:', errorText);
      throw new Error(`DeepSeek API 错误: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as any;
    const content = data.choices?.[0]?.message?.content || '';

    console.log('DeepSeek 返回内容长度:', content.length);
    console.log('DeepSeek 返回内容预览:', content.substring(0, 500));

    // 提取 JSON（处理可能的 markdown 代码块）
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('无法从 AI 响应中提取 JSON，原始内容:', content);
      throw new Error('AI 返回格式错误：无法提取 JSON 数据');
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0];
    const result = JSON.parse(jsonStr);

    console.log('解析成功 - 词汇数:', result.vocabulary?.length, '语法数:', result.grammar?.length, 'Recall 长度:', result.recall?.text_cn?.length);

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

