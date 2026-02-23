import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { Client } from '@notionhq/client';
import { getJwtSecret } from '@/lib/jwt-utils';

const JWT_SECRET = getJwtSecret();

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
    '永久会员': 'lifetime',
    '访客': 'trial' // 🆕 试用用户
  };
  return mapping[chineseTier] || 'quarterly';
}

export async function GET(req: NextRequest) {
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
  let payload;
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    payload = verified.payload;
  } catch (jwtError) {
    // JWT 本身无效（过期/篡改），直接清除 Cookie
    console.error('❌ JWT 验证失败:', jwtError);
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

  const userId = payload.userId as string;
  const email = payload.email as string;

  // 🔐 优化 1：防误杀 - Notion 查询失败时降级为信任 JWT
  try {
    // 🚀 优化 3：精简查询 - 只查询必要字段，提升速度
    const response = await notion.databases.query({
      database_id: MEMBERSHIP_DB,
      filter: {
        property: 'User ID',
        title: {
          equals: userId
        }
      }
    });

    // ❌ 情况 1：用户记录被删除（确认封禁）
    if (response.results.length === 0) {
      console.log('🚫 用户记录不存在，清除 Cookie');
      const res = NextResponse.json({
        success: true,
        data: {
          isAuthenticated: false,
          tier: null,
          tierLabel: '访客',
          reason: 'user_not_found'
        }
      });
      res.cookies.set('ae_membership', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
      });
      return res;
    }

    const page = response.results[0];
    if (!('properties' in page)) {
      console.error('⚠️ Notion 数据格式异常，降级为信任 JWT');
      // 数据异常，但不是用户的错，暂时放行
      return NextResponse.json({
        success: true,
        data: {
          isAuthenticated: true,
          tier: payload.tier || 'quarterly',
          tierLabel: payload.tierLabel || '季度会员',
          userId,
          email,
          activatedAt: payload.activatedAt,
          fallback: true // 标记为降级模式
        }
      });
    }

    const props = page.properties;
    const tierChinese = getSelect(props.Tier);
    const status = getSelect(props.Status);

    // ❌ 情况 2：状态被标记为"已失效"（确认封禁）
    if (status === '❌ 已失效') {
      console.log('🚫 会员状态已失效，清除 Cookie');
      const res = NextResponse.json({
        success: true,
        data: {
          isAuthenticated: false,
          tier: null,
          tierLabel: '访客',
          reason: 'membership_revoked'
        }
      });
      res.cookies.set('ae_membership', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
      });
      return res;
    }

    // ✅ 情况 3：状态正常，返回会员信息
    const tier = convertTierToEnglish(tierChinese);
    console.log('✅ 会员验证通过:', { userId, tier });

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

  } catch (notionError: any) {
    // 🚨 优化 1 核心：Notion API 报错（超时/限流/崩溃）时，降级为信任 JWT
    console.error('⚠️ Notion API 查询失败，降级为信任 JWT:', notionError.message);
    
    // 检查是否是限流错误
    if (notionError.code === 'rate_limited' || notionError.status === 429) {
      console.warn('🚨 Notion API 限流，暂时信任 JWT');
    }

    // JWT 有效但 Notion 查不到，暂时放行（防止误杀）
    return NextResponse.json({
      success: true,
      data: {
        isAuthenticated: true,
        tier: payload.tier || 'quarterly',
        tierLabel: payload.tierLabel || '季度会员',
        userId,
        email,
        activatedAt: payload.activatedAt,
        fallback: true, // 标记为降级模式
        fallbackReason: 'notion_api_error'
      }
    });
  }
}

