import { Client } from '@notionhq/client';

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const REDEMPTION_DB = process.env.NOTION_DB_REDEMPTION || '';

// 辅助函数：解析 Notion 属性
export function getPlainText(property: any): string {
  if (!property) return '';
  if (property.type === 'title' && property.title?.[0]) {
    return property.title[0].plain_text;
  }
  if (property.type === 'rich_text' && property.rich_text?.[0]) {
    return property.rich_text[0].plain_text;
  }
  return '';
}

export function getSelect(property: any): string {
  return property?.select?.name || '';
}

export function getEmail(property: any): string {
  return property?.email || '';
}

export function getDate(property: any): string {
  return property?.date?.start || '';
}

// 查询兑换码
export async function queryRedemptionCode(code: string) {
  try {
    const response = await notion.databases.query({
      database_id: REDEMPTION_DB,
      filter: {
        property: 'Code',
        title: {
          equals: code.trim().toUpperCase()
        }
      }
    });

    return response.results[0] || null;
  } catch (error) {
    console.error('Query redemption code error:', error);
    throw error;
  }
}

// 激活兑换码
export async function activateRedemptionCode(
  pageId: string,
  userEmail: string
) {
  try {
    await notion.pages.update({
      page_id: pageId,
      properties: {
        Status: {
          select: {
            name: '✅ 已激活'
          }
        },
        'User Email': {
          email: userEmail
        },
        ActivatedDate: {
          date: {
            start: new Date().toISOString().split('T')[0]
          }
        }
      }
    });
  } catch (error) {
    console.error('Activate redemption code error:', error);
    throw error;
  }
}

// 转换会员类型（中文 → 英文）
export function convertTierToEnglish(chineseTier: string): string {
  const mapping: Record<string, string> = {
    '季度会员': 'quarterly',
    '年度会员': 'yearly',
    '永久会员': 'lifetime'
  };
  return mapping[chineseTier] || 'quarterly';
}

// 转换会员类型（英文 → 中文）
export function convertTierToChinese(englishTier: string): string {
  const mapping: Record<string, string> = {
    'quarterly': '季度会员',
    'yearly': '年度会员',
    'lifetime': '永久会员'
  };
  return mapping[englishTier] || '访客';
}

























