import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { Client } from '@notionhq/client';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

// 初始化 Notion 客户端
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const MEMBERSHIP_DB = process.env.NOTION_DB_MEMBERSHIPS || '';

// 辅助函数：解析 Notion 属性
function getPlainText(property: any): string {
  if (!property) return '';
  if (property.type === 'title' && property.title?.[0]) {
    return property.title[0].plain_text;
  }
  if (property.type === 'rich_text' && property.rich_text?.[0]) {
    return property.rich_text[0].plain_text;
  }
  return '';
}

function getSelect(property: any): string {
  return property?.select?.name || '';
}

function getEmail(property: any): string {
  return property?.email || '';
}

// 转换会员类型（中文 → 英文）
function convertTierToEnglish(chineseTier: string): string {
  const mapping: Record<string, string> = {
    '季度会员': 'quarterly',
    '年度会员': 'yearly',
    '永久会员': 'lifetime'
  };
  return mapping[chineseTier] || 'quarterly';
}

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('ae_membership')?.value;
    
    if (!token) {
      return NextResponse.json({
        success: true,
        data: {
          isAuthenticated: false,
          tier: null,
          tierLabel: '访客'
        }
      });
    }

    // 验证 JWT
    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    const userId = payload.userId as string;
    const email = payload.email as string;

    // 🔐 关键修改：查询 Notion 数据库验证实时状态
    const response = await notion.databases.query({
      database_id: MEMBERSHIP_DB,
      filter: {
        property: 'User ID',
        title: {
          equals: userId
        }
      }
    });

    // 如果找不到用户记录，清除 Cookie
    if (response.results.length === 0) {
      // 强制删除 Cookie（设置过期时间为过去）
      const response = NextResponse.json({
        success: true,
        data: {
          isAuthenticated: false,
          tier: null,
          tierLabel: '访客',
          reason: 'user_not_found'
        }
      });
      response.cookies.set('ae_membership', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0, // 立即过期
        path: '/',
      });
      return response;
    }

    const page = response.results[0];
    if (!('properties' in page)) {
      const response = NextResponse.json({
        success: true,
        data: {
          isAuthenticated: false,
          tier: null,
          tierLabel: '访客',
          reason: 'invalid_page_data'
        }
      });
      response.cookies.set('ae_membership', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
      });
      return response;
    }

    const props = page.properties;
    const tierChinese = getSelect(props.Tier);
    const status = getSelect(props.Status);

    // 🔐 检查状态：如果是"已失效"，清除 Cookie 并拒绝访问
    if (status === '❌ 已失效') {
      const response = NextResponse.json({
        success: true,
        data: {
          isAuthenticated: false,
          tier: null,
          tierLabel: '访客',
          reason: 'membership_revoked'
        }
      });
      response.cookies.set('ae_membership', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
      });
      return response;
    }

    // ✅ 状态正常，返回会员信息
    const tier = convertTierToEnglish(tierChinese);

    return NextResponse.json({
      success: true,
      data: {
        isAuthenticated: true,
        tier,
        tierLabel: tierChinese || '访客',
        userId,
        email,
        activatedAt: payload.activatedAt
      }
    });

  } catch (error) {
    console.error('Get membership error:', error);
    
    // Token 无效，清除 Cookie
    const response = NextResponse.json({
      success: true,
      data: {
        isAuthenticated: false,
        tier: null,
        tierLabel: '访客',
        reason: 'token_invalid'
      }
    });
    response.cookies.set('ae_membership', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });
    return response;
  }
}

