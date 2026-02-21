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
const REDEMPTION_LOGS_DB = process.env.NOTION_DB_REDEMPTION_LOGS || ''; // 🆕 兑换日志数据库

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

// 🆕 记录兑换日志到 Notion
async function logRedemptionAttempt(params: {
  code: string;
  email: string;
  status: '🟢 成功' | '🔴 失败';
  reason?: string;
  deviceId: string;
  ipAddress: string;
}) {
  try {
    // 如果没有配置日志数据库，跳过
    if (!REDEMPTION_LOGS_DB) {
      console.warn('⚠️ NOTION_DB_REDEMPTION_LOGS 未配置，跳过日志记录');
      return;
    }

    const logId = `LOG_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    const properties: any = {
      'Log ID': {
        title: [{
          text: { content: logId }
        }]
      },
      'Attempted Code': {
        rich_text: [{
          text: { content: params.code }
        }]
      },
      'Status': {
        select: {
          name: params.status
        }
      },
      'Reason': {
        rich_text: [{
          text: { content: params.reason || '-' }
        }]
      },
      'Device ID': {
        rich_text: [{
          text: { content: params.deviceId }
        }]
      },
      'Time': {
        date: {
          start: new Date().toISOString()
        }
      },
      'IP Address': {
        rich_text: [{
          text: { content: params.ipAddress }
        }]
      }
    };

    // 只有当邮箱存在时才添加 Email 字段
    if (params.email) {
      properties['Email'] = {
        email: params.email
      };
    }
    
    await notion.pages.create({
      parent: { database_id: REDEMPTION_LOGS_DB },
      properties
    });
    
    console.log('✅ 兑换日志已记录:', logId);
  } catch (error) {
    console.error('❌ 记录兑换日志失败:', error);
    // 不影响主流程，继续执行
  }
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
    
    // 获取设备信息
    const deviceId = generateDeviceId(req);
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

    if (!code || !code.trim()) {
      // 🆕 记录失败日志
      await logRedemptionAttempt({
        code: code || '',
        email: email || '',
        status: '🔴 失败',
        reason: '未输入兑换码',
        deviceId,
        ipAddress
      });
      
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
      // 🆕 记录失败日志
      await logRedemptionAttempt({
        code: code.trim().toUpperCase(),
        email: email || '',
        status: '🔴 失败',
        reason: '兑换码不存在',
        deviceId,
        ipAddress
      });
      
      return NextResponse.json(
        { success: false, error: 'code_not_found', message: '兑换码不存在' },
        { status: 404 }
      );
    }

    const page = response.results[0];
    if (!('properties' in page)) {
      // 🆕 记录失败日志
      await logRedemptionAttempt({
        code: code.trim().toUpperCase(),
        email: email || '',
        status: '🔴 失败',
        reason: '数据格式错误',
        deviceId,
        ipAddress
      });
      
      return NextResponse.json(
        { success: false, error: 'invalid_data', message: '数据格式错误' },
        { status: 500 }
      );
    }

    const props = page.properties;
    const status = getSelect(props.Status);
    const type = getSelect(props.Type);
    const storedEmail = getEmail(props['User Email']);

    // 2. 🔥 新逻辑：兑换码变成"永久通行证"
    // 只要兑换码存在且未失效，就允许登录
    
    // ❌ 唯一拒绝的情况：兑换码已失效
    if (status === '❌ 已失效') {
      // 🆕 记录失败日志
      await logRedemptionAttempt({
        code: code.trim().toUpperCase(),
        email: email || '',
        status: '🔴 失败',
        reason: '该兑换码已失效',
        deviceId,
        ipAddress
      });
      
      return NextResponse.json(
        { success: false, error: 'code_expired', message: '该兑换码已失效' },
        { status: 400 }
      );
    }

    // ✅ 其他所有情况（待售、已发货、已激活）都允许登录
    const tier = convertTierToEnglish(type);
    const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // 3. 如果是首次激活（待售/已发货），更新 Redemption Codes 状态
    if (status === '🆕 待售' || status === '📤 已发货') {
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
    }

    // 4. 每次登录都创建 Memberships 记录（支持多设备）
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
      'Tier': {
        select: {
          name: type
        }
      },
      'Redemption Code': {
        rich_text: [{
          text: { content: code.trim().toUpperCase() }
        }]
      },
      'Activated At': {
        date: {
          start: new Date().toISOString().split('T')[0]
        }
      }
    };

    if (email || storedEmail) {
      createProperties['Email'] = {
        email: email || storedEmail
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

    // 5. 记录成功日志
    const isRelogin = status === '✅ 已激活';
    await logRedemptionAttempt({
      code: code.trim().toUpperCase(),
      email: email || storedEmail || '',
      status: '🟢 成功',
      reason: isRelogin ? '重复登录（已激活）' : '首次激活',
      deviceId,
      ipAddress
    });

    // 6. 生成 JWT Token（无论是首次激活还是重复登录）
    const token = await new SignJWT({
      userId,
      tier,
      email: email?.trim() || storedEmail || '',
      deviceId,
      activatedAt: Date.now(),
      isRelogin: status === '✅ 已激活' // 标记是否为重复登录
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(tier === 'lifetime' ? '10y' : tier === 'yearly' ? '1y' : '90d')
      .sign(JWT_SECRET);

    // 7. 设置 HttpOnly Cookie
    const cookieStore = await cookies();
    cookieStore.set('ae_membership', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // 🔧 改为 lax，提高兼容性
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
      message: isRelogin ? '欢迎回来！已为当前设备恢复访问权限' : '兑换成功！',
      data: {
        tier,
        tierLabel: type,
        isRelogin
      }
    });

  } catch (error) {
    console.error('Redemption error:', error);
    
    // 🆕 记录异常日志
    try {
      const deviceId = generateDeviceId(req);
      const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
      
      await logRedemptionAttempt({
        code: 'UNKNOWN',
        email: '',
        status: '🔴 失败',
        reason: `服务器错误: ${error instanceof Error ? error.message : String(error)}`,
        deviceId,
        ipAddress
      });
    } catch (logError) {
      console.error('记录异常日志失败:', logError);
    }
    
    return NextResponse.json(
      { success: false, error: 'server_error', message: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
// trigger redeploy Sat Feb 21 21:40:52 CST 2026
