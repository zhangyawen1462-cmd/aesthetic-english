import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@notionhq/client';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';

// 初始化 Notion 客户端
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const REDEMPTION_DB = process.env.NOTION_DB_REDEMPTION || '';
const MEMBERSHIP_DB = process.env.NOTION_DB_MEMBERSHIPS || '';

// JWT 密钥
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

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

function getDate(property: any): string {
  return property?.date?.start || '';
}

// 生成设备指纹（简化版）
function generateDeviceId(req: NextRequest): string {
  const userAgent = req.headers.get('user-agent') || '';
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const timestamp = Date.now();
  
  // 简单的哈希函数
  const hash = Buffer.from(`${userAgent}-${ip}-${timestamp}`).toString('base64').substring(0, 16);
  return `device_${hash}`;
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

export async function POST(req: NextRequest) {
  try {
    const { code, email } = await req.json();

    if (!code || !code.trim()) {
      return NextResponse.json(
        { success: false, error: 'invalid_code', message: '请输入兑换码' },
        { status: 400 }
      );
    }

    // 1. 查询 Notion 兑换码数据库
    const response = await notion.databases.query({
      database_id: REDEMPTION_DB,
      filter: {
        property: 'Code',
        title: {
          equals: code.trim().toUpperCase()
        }
      }
    });

    if (response.results.length === 0) {
      return NextResponse.json(
        { success: false, error: 'code_not_found', message: '兑换码不存在' },
        { status: 404 }
      );
    }

    const page = response.results[0];
    if (!('properties' in page)) {
      return NextResponse.json(
        { success: false, error: 'invalid_data', message: '数据格式错误' },
        { status: 500 }
      );
    }

    const props = page.properties;
    const status = getSelect(props.Status);
    const type = getSelect(props.Type);
    const storedEmail = getEmail(props['User Email']);

    // 2. 验证兑换码状态
    if (status === '✅ 已激活') {
      // 🆕 核心逻辑：支持多设备登录
      if (!email || !email.trim()) {
        return NextResponse.json(
          { success: false, error: 'email_required', message: '该兑换码已激活，请输入当时使用的邮箱以恢复访问' },
          { status: 400 }
        );
      }

      // 比对邮箱（忽略大小写）
      if (storedEmail.toLowerCase() === email.trim().toLowerCase()) {
        // ✅ 邮箱匹配，视为老用户换设备，重新颁发 JWT
        const deviceId = generateDeviceId(req);
        const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const tier = convertTierToEnglish(type);
        
        // 生成新的 JWT Token
        const token = await new SignJWT({
          userId,
          tier,
          email: email.trim(),
          deviceId,
          activatedAt: Date.now(),
          isRelogin: true // 标记为重新登录
        })
          .setProtectedHeader({ alg: 'HS256' })
          .setIssuedAt()
          .setExpirationTime(tier === 'lifetime' ? '10y' : tier === 'yearly' ? '1y' : '90d')
          .sign(JWT_SECRET);

        // 设置 HttpOnly Cookie
        const cookieStore = await cookies();
        cookieStore.set('ae_membership', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: tier === 'lifetime' 
            ? 10 * 365 * 24 * 60 * 60 
            : tier === 'yearly'
              ? 365 * 24 * 60 * 60
              : 90 * 24 * 60 * 60,
          path: '/'
        });

        // 返回成功响应
        return NextResponse.json({
          success: true,
          message: '欢迎回来！已为当前设备恢复访问权限',
          data: {
            tier,
            tierLabel: type,
            isRelogin: true
          }
        });
      } else {
        // ❌ 邮箱不匹配
        return NextResponse.json(
          { success: false, error: 'code_used', message: 'This key has already been claimed.' },
          { status: 400 }
        );
      }
    }

    if (status === '❌ 已失效') {
      return NextResponse.json(
        { success: false, error: 'code_expired', message: '该兑换码已失效' },
        { status: 400 }
      );
    }

    if (status !== '🆕 待售' && status !== '📤 已发货') {
      return NextResponse.json(
        { success: false, error: 'invalid_status', message: '兑换码状态异常' },
        { status: 400 }
      );
    }

    // 3. 生成用户 ID（设备指纹）
    const deviceId = generateDeviceId(req);
    const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // 4. 更新 Notion 兑换码状态
    const updateProperties: any = {
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
      'Device ID': {
        rich_text: [{
          text: { content: deviceId }
        }]
      }
    };

    if (email) {
      updateProperties['User Email'] = {
        email: email
      };
    }

    await notion.pages.update({
      page_id: page.id,
      properties: updateProperties
    });

    // 5. 创建用户通行证记录
    const tier = convertTierToEnglish(type);
    const expiresAt = tier === 'lifetime' 
      ? null 
      : tier === 'yearly'
        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    const createProperties: any = {
      'User ID': {
        title: [{
          text: { content: userId }
        }]
      },
      Tier: {
        select: {
          name: type
        }
      },
      'Activated At': {
        date: {
          start: new Date().toISOString().split('T')[0]
        }
      }
    };

    if (email) {
      createProperties['Email'] = {
        email: email
      };
    }

    if (expiresAt) {
      createProperties['Expires At'] = {
        date: {
          start: expiresAt.toISOString().split('T')[0]
        }
      };
    }

    await notion.pages.create({
      parent: { database_id: MEMBERSHIP_DB },
      properties: createProperties
    });

    // 6. 生成 JWT Token
    const token = await new SignJWT({
      userId,
      tier,
      email: email?.trim() || '',
      deviceId,
      activatedAt: Date.now()
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(tier === 'lifetime' ? '10y' : tier === 'yearly' ? '1y' : '90d')
      .sign(JWT_SECRET);

    // 7. 设置 HttpOnly Cookie
    const cookieStore = await cookies(); // 🆕 Next.js 15+ 需要 await
    cookieStore.set('ae_membership', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: tier === 'lifetime' 
        ? 10 * 365 * 24 * 60 * 60 
        : tier === 'yearly'
          ? 365 * 24 * 60 * 60
          : 90 * 24 * 60 * 60,
      path: '/'
    });

    // 8. 返回成功响应
    return NextResponse.json({
      success: true,
      message: '兑换成功！',
      data: {
        tier,
        tierLabel: type,
        expiresAt: expiresAt?.toISOString()
      }
    });

  } catch (error) {
    console.error('Redemption error:', error);
    return NextResponse.json(
      { success: false, error: 'server_error', message: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
