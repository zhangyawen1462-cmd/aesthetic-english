// ============================================================
// Notion API 客户端 - 数据获取层
// ============================================================

import { Client } from '@notionhq/client';
import type { Lesson, VocabCard, GrammarNote, RecallText } from '@/data/types';
import { normalizeCdnUrl } from './utils';

// 开发环境日志辅助函数
const isDev = process.env.NODE_ENV === 'development';
const devLog = (...args: any[]) => {
  if (isDev) console.log(...args);
};

// 初始化 Notion 客户端
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
  timeoutMs: 30000, // 设置 30 秒超时
});

// 调试信息（仅开发环境）
devLog('Notion Client initialized:', {
  hasAuth: !!process.env.NOTION_API_KEY,
  hasDatabases: !!notion.databases,
  hasQuery: typeof notion.databases?.query,
});

// 辅助函数：格式化数据库 ID（自动添加连字符）
function formatDatabaseId(id: string): string {
  if (!id) return '';
  // 如果已经有连字符，直接返回
  if (id.includes('-')) return id;
  // 如果是32位无连字符格式，转换为 8-4-4-4-12 格式
  if (id.length === 32) {
    return id.replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5');
  }
  return id;
}

// Notion 数据库 ID（从环境变量读取并格式化）
const DATABASES = {
  lessons: formatDatabaseId(process.env.NOTION_DB_LESSONS || ''),
  vocabulary: formatDatabaseId(process.env.NOTION_DB_VOCABULARY || ''),
  grammar: formatDatabaseId(process.env.NOTION_DB_GRAMMAR || ''),
  recall: formatDatabaseId(process.env.NOTION_DB_RECALL || ''),
  redemption: formatDatabaseId(process.env.NOTION_DB_REDEMPTION || ''),
};

// ============================================================
// 辅助函数：解析 Notion 属性
// ============================================================

function getPlainText(property: any): string {
  if (!property) return '';
  
  // 处理 title 类型（合并所有文本块）
  if (property.type === 'title' && property.title) {
    return property.title.map((t: any) => t.plain_text).join('');
  }
  
  // 处理 rich_text 类型（合并所有文本块）
  if (property.type === 'rich_text' && property.rich_text) {
    return property.rich_text.map((t: any) => t.plain_text).join('');
  }
  
  return '';
}

function getNumber(property: any): number {
  return property?.number || 0;
}

function getSelect(property: any): string {
  return property?.select?.name || '';
}

function getUrl(property: any): string {
  return property?.url || '';
}

function getDate(property: any): string {
  return property?.date?.start || '';
}

function getRelation(property: any): string[] {
  return property?.relation?.map((r: any) => r.id) || [];
}

function getCheckbox(property: any): boolean {
  return property?.checkbox || false;
}

// 🆕 新增：读取 Select 类型的布尔值（用于 Is_Sample）
function getSelectBoolean(property: any): boolean {
  return property?.select?.name === 'true';
}

// ============================================================
// 核心函数：获取所有课程（仅基础信息，不含关联数据）
// 🚀 性能优化：用于列表页，不加载 vocab/grammar/recall
// ============================================================

export async function getAllLessons(): Promise<Lesson[]> {
  try {
    // 调试日志
    console.log('🔍 Fetching lessons from Notion...', {
      database_id: DATABASES.lessons,
      hasAuth: !!process.env.NOTION_API_KEY,
    });

    const response = await notion.databases.query({
      database_id: DATABASES.lessons,
      filter: {
        property: 'Status',
        select: {
          equals: 'Published'
        }
      },
      sorts: [
        {
          property: 'Date',
          direction: 'descending'
        }
      ]
    });

    console.log('✅ Notion query successful, results:', response.results.length);

    const lessons: Lesson[] = [];

    for (const page of response.results) {
      if (!('properties' in page)) continue;

      const props = page.properties;
      const lessonId = getPlainText(props.Lesson_ID);
      
      // 🔍 使用 Select 类型读取 Is_Sample
      const isSampleValue = getSelectBoolean(props['Is_Sample']);

      // 🚀 列表页不需要关联数据，直接返回空数组
      lessons.push({
        id: lessonId,
        category: getSelect(props.Category).toLowerCase() as 'daily' | 'cognitive' | 'business',
        ep: getPlainText(props.EP) || '00',
        titleCn: getPlainText(props.Title_CN),
        titleEn: getPlainText(props.Title_EN),
        subtitle: getPlainText(props.Subtitle),
        coverImg: normalizeCdnUrl(getUrl(props.Cover_Img)),
        coverImg16x9: normalizeCdnUrl(getUrl(props.Cover_Img_16x9)),
        coverRatio: getSelect(props.Cover_Ratio) as '3/4' | '1/1' | '9/16' | '16/9' | 'square',
        videoUrl: normalizeCdnUrl(getUrl(props.Video_URL)),
        date: formatDate(getDate(props.Date)),
        srtRaw: getPlainText(props.SRT_Raw),
        displayPosition: getSelect(props.Display_Position),
        sortOrder: getNumber(props.Sort_Order),
        isSample: isSampleValue,
        vocab: [], // 列表页不需要
        grammar: [], // 列表页不需要
        recall: { cn: '', en: '' }, // 列表页不需要
      });
    }

    return lessons;
  } catch (error) {
    console.error('❌ Error fetching lessons from Notion:', error);
    // 抛出错误而不是返回空数组，让上层能看到真正的错误
    throw error;
  }
}

// ============================================================
// 核心函数：根据 ID 获取单个课程
// ============================================================

export async function getLessonById(id: string): Promise<Lesson | null> {
  try {
    const response = await notion.databases.query({
      database_id: DATABASES.lessons,
      filter: {
        and: [
          {
            property: 'Lesson_ID',
            title: {
              equals: id
            }
          },
          {
            property: 'Status',
            select: {
              equals: 'Published'
            }
          }
        ]
      }
    });

    if (response.results.length === 0) return null;

    const page = response.results[0];
    if (!('properties' in page)) return null;

    const props = page.properties;
    
    // 🔍 使用 Select 类型读取 Is_Sample
    const isSampleValue = getSelectBoolean(props['Is_Sample']);

    // 获取关联数据
    const [vocab, grammar, recall] = await Promise.all([
      getVocabularyByLessonId(page.id),
      getGrammarByLessonId(page.id),
      getRecallByLessonId(page.id),
    ]);

    return {
      id: getPlainText(props.Lesson_ID),
      category: getSelect(props.Category).toLowerCase() as 'daily' | 'cognitive' | 'business',
      ep: getPlainText(props.EP) || '00',
      titleCn: getPlainText(props.Title_CN),
      titleEn: getPlainText(props.Title_EN),
      subtitle: getPlainText(props.Subtitle),
      coverImg: normalizeCdnUrl(getUrl(props.Cover_Img)),
      coverImg16x9: normalizeCdnUrl(getUrl(props.Cover_Img_16x9)),
      coverRatio: getSelect(props.Cover_Ratio) as '3/4' | '1/1' | '9/16' | '16/9' | 'square',
      videoUrl: normalizeCdnUrl(getUrl(props.Video_URL)),
      audioUrl: normalizeCdnUrl(getUrl(props.Audio_URL)),
      date: formatDate(getDate(props.Date)),
      srtRaw: getPlainText(props.SRT_Raw),
      displayPosition: getSelect(props.Display_Position),
      sortOrder: getNumber(props.Sort_Order),
      isSample: isSampleValue,
      vocab,
      grammar,
      recall,
    };
  } catch (error) {
    console.error(`Error fetching lesson ${id} from Notion:`, error);
    return null;
  }
}

// ============================================================
// 辅助函数：获取词汇
// ============================================================

async function getVocabularyByLessonId(lessonPageId: string): Promise<VocabCard[]> {
  try {
    const response = await notion.databases.query({
      database_id: DATABASES.vocabulary,
      filter: {
        property: 'Lesson',
        relation: {
          contains: lessonPageId
        }
      }
    });

    return response.results.map((page: any, index: number) => {
      if (!('properties' in page)) return null;
      const props = page.properties;

      return {
        id: index + 1,
        word: getPlainText(props.Word),
        phonetic: getPlainText(props.Phonetic),
        def: getPlainText(props.Definition),
        defCn: getPlainText(props.Definition_CN),
        ex: getPlainText(props.Example),
      };
    }).filter(Boolean) as VocabCard[];
  } catch (error) {
    console.error('Error fetching vocabulary:', error);
    return [];
  }
}

// ============================================================
// 辅助函数：获取语法
// ============================================================

async function getGrammarByLessonId(lessonPageId: string): Promise<GrammarNote[]> {
  try {
    const response = await notion.databases.query({
      database_id: DATABASES.grammar,
      filter: {
        property: 'Lesson',
        relation: {
          contains: lessonPageId
        }
      }
    });

    return response.results.map((page: any, index: number) => {
      if (!('properties' in page)) return null;
      const props = page.properties;

      return {
        id: index + 1,
        point: getPlainText(props.Point),
        desc: getPlainText(props.Description),
        ex: getPlainText(props.Example),
        start: getNumber(props.Timestamp),
      };
    }).filter(Boolean) as GrammarNote[];
  } catch (error) {
    console.error('Error fetching grammar:', error);
    return [];
  }
}

// ============================================================
// 辅助函数：获取回译文本
// ============================================================

async function getRecallByLessonId(lessonPageId: string): Promise<RecallText> {
  try {
    const response = await notion.databases.query({
      database_id: DATABASES.recall,
      filter: {
        property: 'Lesson',
        relation: {
          contains: lessonPageId
        }
      }
    });

    if (response.results.length === 0) {
      return { cn: '', en: '' };
    }

    const page = response.results[0];
    if (!('properties' in page)) return { cn: '', en: '' };

    const props = page.properties;

    return {
      cn: getPlainText(props.Text_CN),
      en: getPlainText(props.Text_EN),
    };
  } catch (error) {
    console.error('Error fetching recall:', error);
    return { cn: '', en: '' };
  }
}

// ============================================================
// 辅助函数：格式化日期
// ============================================================

function formatDate(dateString: string): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const month = date.toLocaleString('en-US', { month: 'short' });
  const day = date.getDate().toString().padStart(2, '0');
  
  return `${month} ${day}`;
}

// ============================================================
// 导出：按分类获取课程
// ============================================================

export async function getLessonsByCategory(category: string): Promise<Lesson[]> {
  const allLessons = await getAllLessons();
  return allLessons.filter(l => l.category === category);
}

// ============================================================
// 导出：获取最新 N 期课程
// ============================================================

export async function getLatestLessons(category: string, count: number = 5): Promise<Lesson[]> {
  const lessons = await getLessonsByCategory(category);
  return lessons.slice(0, count);
}

// ============================================================
// 导出：获取 Dashboard 布局（根据 Display_Position 和 Sort_Order）
// ============================================================

export async function getDashboardLayout(): Promise<Lesson[]> {
  try {
    console.log('🔍 Fetching dashboard layout...', {
      database_id: DATABASES.lessons,
      filter: 'Status=Published AND Display_Position=dashboard-featured',
    });

    const response = await notion.databases.query({
      database_id: DATABASES.lessons,
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

    console.log('✅ Dashboard query successful, results:', response.results.length);

    const lessons: Lesson[] = [];

    for (const page of response.results) {
      if (!('properties' in page)) continue;

      const props = page.properties;

      // 🚀 Dashboard 不需要关联数据,直接返回空数组
      lessons.push({
        id: getPlainText(props.Lesson_ID),
        category: getSelect(props.Category).toLowerCase() as 'daily' | 'cognitive' | 'business',
        ep: getPlainText(props.EP) || '00',
        titleCn: getPlainText(props.Title_CN),
        titleEn: getPlainText(props.Title_EN),
        subtitle: getPlainText(props.Subtitle),
        coverImg: normalizeCdnUrl(getUrl(props.Cover_Img)),
        coverImg16x9: normalizeCdnUrl(getUrl(props.Cover_Img_16x9)),
        coverRatio: getSelect(props.Cover_Ratio) as '3/4' | '1/1' | '9/16' | '16/9' | 'square',
        videoUrl: normalizeCdnUrl(getUrl(props.Video_URL)),
        date: formatDate(getDate(props.Date)),
        srtRaw: getPlainText(props.SRT_Raw),
        displayPosition: getSelect(props.Display_Position),
        sortOrder: getNumber(props.Sort_Order),
        isSample: getSelectBoolean(props['Is_Sample']),
        vocab: [], // Dashboard 不需要
        grammar: [], // Dashboard 不需要
        recall: { cn: '', en: '' }, // Dashboard 不需要
      });
    }

    return lessons;
  } catch (error) {
    console.error('❌ Error fetching dashboard layout from Notion:', error);
    throw error;
  }
}

// ============================================================
// 导出：获取 Daily Cinema 布局
// ============================================================

export async function getDailyCinemaLayout(): Promise<Lesson[]> {
  try {
    const response = await notion.databases.query({
      database_id: DATABASES.lessons,
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
              equals: 'daily-cinema'
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

    const lessons: Lesson[] = [];

    for (const page of response.results) {
      if (!('properties' in page)) continue;

      const props = page.properties;

      // 🚀 列表页不需要关联数据
      lessons.push({
        id: getPlainText(props.Lesson_ID),
        category: getSelect(props.Category).toLowerCase() as 'daily' | 'cognitive' | 'business',
        ep: getPlainText(props.EP) || '00',
        titleCn: getPlainText(props.Title_CN),
        titleEn: getPlainText(props.Title_EN),
        subtitle: getPlainText(props.Subtitle),
        coverImg: normalizeCdnUrl(getUrl(props.Cover_Img)),
        coverImg16x9: normalizeCdnUrl(getUrl(props.Cover_Img_16x9)),
        coverRatio: getSelect(props.Cover_Ratio) as '3/4' | '1/1' | '9/16' | '16/9' | 'square',
        videoUrl: normalizeCdnUrl(getUrl(props.Video_URL)),
        date: formatDate(getDate(props.Date)),
        srtRaw: getPlainText(props.SRT_Raw),
        displayPosition: getSelect(props.Display_Position),
        sortOrder: getNumber(props.Sort_Order),
        isSample: getSelectBoolean(props['Is_Sample']),
        vocab: [],
        grammar: [],
        recall: { cn: '', en: '' },
      });
    }

    return lessons;
  } catch (error) {
    console.error('Error fetching daily cinema layout from Notion:', error);
    return [];
  }
}

// ============================================================
// 导出：获取 Cognitive Featured 布局
// ============================================================

export async function getCognitiveFeaturedLayout(): Promise<Lesson[]> {
  try {
    const response = await notion.databases.query({
      database_id: DATABASES.lessons,
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
              equals: 'cognitive-featured'
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

    const lessons: Lesson[] = [];

    for (const page of response.results) {
      if (!('properties' in page)) continue;

      const props = page.properties;

      // 🚀 列表页不需要关联数据
      lessons.push({
        id: getPlainText(props.Lesson_ID),
        category: getSelect(props.Category).toLowerCase() as 'daily' | 'cognitive' | 'business',
        ep: getPlainText(props.EP) || '00',
        titleCn: getPlainText(props.Title_CN),
        titleEn: getPlainText(props.Title_EN),
        subtitle: getPlainText(props.Subtitle),
        coverImg: normalizeCdnUrl(getUrl(props.Cover_Img)),
        coverImg16x9: normalizeCdnUrl(getUrl(props.Cover_Img_16x9)),
        coverRatio: getSelect(props.Cover_Ratio) as '3/4' | '1/1' | '9/16' | '16/9' | 'square',
        videoUrl: normalizeCdnUrl(getUrl(props.Video_URL)),
        date: formatDate(getDate(props.Date)),
        srtRaw: getPlainText(props.SRT_Raw),
        displayPosition: getSelect(props.Display_Position),
        sortOrder: getNumber(props.Sort_Order),
        isSample: getSelectBoolean(props['Is_Sample']),
        vocab: [],
        grammar: [],
        recall: { cn: '', en: '' },
      });
    }

    return lessons;
  } catch (error) {
    console.error('Error fetching cognitive featured layout from Notion:', error);
    return [];
  }
}

// ============================================================
// 导出：获取 Business Featured 布局
// ============================================================

export async function getBusinessFeaturedLayout(): Promise<Lesson[]> {
  try {
    const response = await notion.databases.query({
      database_id: DATABASES.lessons,
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
              equals: 'business-featured'
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

    const lessons: Lesson[] = [];

    for (const page of response.results) {
      if (!('properties' in page)) continue;

      const props = page.properties;

      // 🚀 列表页不需要关联数据
      lessons.push({
        id: getPlainText(props.Lesson_ID),
        category: getSelect(props.Category).toLowerCase() as 'daily' | 'cognitive' | 'business',
        ep: getPlainText(props.EP) || '00',
        titleCn: getPlainText(props.Title_CN),
        titleEn: getPlainText(props.Title_EN),
        subtitle: getPlainText(props.Subtitle),
        coverImg: normalizeCdnUrl(getUrl(props.Cover_Img)),
        coverImg16x9: normalizeCdnUrl(getUrl(props.Cover_Img_16x9)),
        coverRatio: getSelect(props.Cover_Ratio) as '3/4' | '1/1' | '9/16' | '16/9' | 'square',
        videoUrl: normalizeCdnUrl(getUrl(props.Video_URL)),
        date: formatDate(getDate(props.Date)),
        srtRaw: getPlainText(props.SRT_Raw),
        displayPosition: getSelect(props.Display_Position),
        sortOrder: getNumber(props.Sort_Order),
        isSample: getSelectBoolean(props['Is_Sample']),
        vocab: [],
        grammar: [],
        recall: { cn: '', en: '' },
      });
    }

    return lessons;
  } catch (error) {
    console.error('Error fetching business featured layout from Notion:', error);
    return [];
  }
}

// ============================================================
// 兑换码相关函数
// ============================================================

export interface RedemptionCode {
  code: string;
  type: string;
  status: string;
  created: string;
  activated?: string;
  userEmail?: string;
  notes?: string;
}

// 验证兑换码
export async function verifyRedemptionCode(code: string): Promise<{
  valid: boolean;
  type?: string;
  message: string;
  pageId?: string;
}> {
  try {
    const response = await notion.databases.query({
      database_id: DATABASES.redemption,
      filter: {
        property: 'Code',
        title: {
          equals: code
        }
      }
    });

    if (response.results.length === 0) {
      return { valid: false, message: '兑换码不存在' };
    }

    const page = response.results[0];
    if (!('properties' in page)) {
      return { valid: false, message: '数据格式错误' };
    }

    const props = page.properties;
    const status = getSelect(props.Status);
    const type = getSelect(props.Type);

    // 检查状态
    if (status === '✅ 已激活') {
      return { valid: false, message: '该兑换码已被使用' };
    }

    if (status === '❌ 已失效') {
      return { valid: false, message: '该兑换码已失效' };
    }

    if (status !== '🆕 待售' && status !== '📤 已发货') {
      return { valid: false, message: '兑换码状态异常' };
    }

    return {
      valid: true,
      type,
      message: '兑换码有效',
      pageId: page.id
    };
  } catch (error) {
    console.error('Error verifying redemption code:', error);
    return { valid: false, message: '验证失败，请稍后重试' };
  }
}

// 激活兑换码
export async function activateRedemptionCode(
  pageId: string,
  userEmail: string
): Promise<{ success: boolean; message: string }> {
  try {
    await notion.pages.update({
      page_id: pageId,
      properties: {
        Status: {
          select: {
            name: '✅ 已激活'
          }
        },
        Activated: {
          date: {
            start: new Date().toISOString().split('T')[0]
          }
        },
        'User Email': {
          email: userEmail
        }
      }
    });

    return { success: true, message: '激活成功' };
  } catch (error) {
    console.error('Error activating redemption code:', error);
    return { success: false, message: '激活失败，请稍后重试' };
  }
}

