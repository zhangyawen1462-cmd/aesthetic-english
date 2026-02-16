// ============================================================
// AI 内容生成 API - 使用 DeepSeek
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import type { AIGenerateRequest, AIGenerateResponse, AIGeneratedContent } from '@/data/types';

// DeepSeek API 配置
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// ============================================================
// Prompts
// ============================================================

const VOCABULARY_PROMPT = `你是一位专业的英语教师，擅长从对话中提取核心词汇。

任务：从给定的英文字幕中，提取 5-10 个最值得学习的词汇或短语。

标准：
1. 优先选择高级词汇、地道表达、习语
2. 避免过于简单的词汇（如 the, is, have）
3. 包含实用的短语搭配

输出格式（JSON）：
{
  "vocabulary": [
    {
      "word": "单词或短语",
      "phonetic": "音标（使用 IPA）",
      "definition": "英文释义（简洁）",
      "definition_cn": "中文释义",
      "example": "例句（最好来自原文）",
      "order": 1
    }
  ]
}

要求：
- 严格按照 JSON 格式输出
- 音标使用国际音标（IPA）
- 例句尽量使用原文中的句子
- 按重要性排序（order: 1, 2, 3...）`;

const GRAMMAR_PROMPT = `你是一位专业的英语语法老师，擅长从对话中提取语法点。

任务：从给定的英文字幕中，提取 3-5 个值得学习的语法点。

标准：
1. 优先选择特殊句式、时态用法、语法结构
2. 避免过于基础的语法（如主谓一致）
3. 提供清晰的解析和例句

输出格式（JSON）：
{
  "grammar": [
    {
      "point": "语法点标题（中文）",
      "description": "详细解析（中文，100-200字）",
      "example": "例句（来自原文）",
      "timestamp": 0,
      "order": 1
    }
  ]
}

要求：
- 严格按照 JSON 格式输出
- 解析要通俗易懂，适合中级学习者
- timestamp 暂时填 0（后续可手动调整）
- 按重要性排序（order: 1, 2, 3...）`;

const RECALL_PROMPT = `你是一位专业的英语教师，擅长设计回译练习。

任务：从给定的英文字幕中，提取 1-2 个核心句子，生成回译练习。

标准：
1. 选择最有代表性、最实用的句子
2. 句子长度适中（10-20 词）
3. 包含本课的核心词汇或语法点

输出格式（JSON）：
{
  "recall": {
    "text_cn": "中文翻译（自然流畅）",
    "text_en": "英文原文"
  }
}

要求：
- 严格按照 JSON 格式输出
- 中文翻译要自然，不要逐字翻译
- 英文原文保持原样`;

// ============================================================
// 辅助函数：解析 SRT
// ============================================================

function parseSRT(srtContent: string): string {
  const lines = srtContent.split('\n');
  const textLines: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // 跳过序号行
    if (/^\d+$/.test(line)) continue;
    
    // 跳过时间戳行
    if (/\d{2}:\d{2}:\d{2}/.test(line)) continue;
    
    // 跳过空行
    if (line === '') continue;
    
    textLines.push(line);
  }
  
  return textLines.join('\n');
}

// ============================================================
// 辅助函数：调用 DeepSeek API
// ============================================================

async function callDeepSeek(prompt: string, content: string): Promise<any> {
  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: content }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`DeepSeek API error: ${error}`);
  }

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

// ============================================================
// POST 处理函数
// ============================================================

export async function POST(request: NextRequest) {
  try {
    // 检查 API Key
    if (!DEEPSEEK_API_KEY) {
      return NextResponse.json<AIGenerateResponse>(
        { success: false, error: '未配置 DEEPSEEK_API_KEY' },
        { status: 500 }
      );
    }

    // 解析请求
    const body: AIGenerateRequest = await request.json();
    const { srtContent, lessonId, options = {} } = body;

    if (!srtContent || !lessonId) {
      return NextResponse.json<AIGenerateResponse>(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 解析 SRT
    const transcript = parseSRT(srtContent);

    if (!transcript) {
      return NextResponse.json<AIGenerateResponse>(
        { success: false, error: 'SRT 内容为空或格式错误' },
        { status: 400 }
      );
    }

    console.log('🤖 开始 AI 生成...');
    console.log('📝 Lesson ID:', lessonId);
    console.log('📄 字幕长度:', transcript.length, '字符');

    // 并行调用 AI
    const tasks = [];
    
    if (options.generateVocab !== false) {
      tasks.push(callDeepSeek(VOCABULARY_PROMPT, transcript));
    } else {
      tasks.push(Promise.resolve({ vocabulary: [] }));
    }
    
    if (options.generateGrammar !== false) {
      tasks.push(callDeepSeek(GRAMMAR_PROMPT, transcript));
    } else {
      tasks.push(Promise.resolve({ grammar: [] }));
    }
    
    if (options.generateRecall !== false) {
      tasks.push(callDeepSeek(RECALL_PROMPT, transcript));
    } else {
      tasks.push(Promise.resolve({ recall: { text_cn: '', text_en: '' } }));
    }

    const [vocabResult, grammarResult, recallResult] = await Promise.all(tasks);

    const content: AIGeneratedContent = {
      vocabulary: vocabResult.vocabulary || [],
      grammar: grammarResult.grammar || [],
      recall: recallResult.recall || { text_cn: '', text_en: '' },
    };

    console.log('✅ AI 生成完成');
    console.log('📚 词汇:', content.vocabulary.length, '个');
    console.log('📖 语法:', content.grammar.length, '个');
    console.log('🔄 回译:', content.recall.text_en ? '已生成' : '未生成');

    return NextResponse.json<AIGenerateResponse>({
      success: true,
      data: content,
    });

  } catch (error) {
    console.error('❌ AI 生成失败:', error);
    return NextResponse.json<AIGenerateResponse>(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '未知错误' 
      },
      { status: 500 }
    );
  }
}

