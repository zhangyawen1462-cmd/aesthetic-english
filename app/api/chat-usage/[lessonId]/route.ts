import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { kv } from '@vercel/kv';
import { PERMISSIONS } from '@/lib/permissions';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

// 🔧 开发环境：内存存储（与 ai-chat-secure 共享）
const devChatCounts = new Map<string, number>();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { lessonId } = await params;
    
    // 🔧 开发环境：允许通过 header 模拟会员身份
    const isDev = process.env.NODE_ENV === 'development';
    const devTier = req.headers.get('x-dev-tier');
    
    let tier: string;
    let userId: string;
    
    if (isDev && devTier) {
      // 开发模式：使用模拟身份
      tier = devTier;
      userId = 'dev_user_fixed'; // 使用固定ID以便追踪计数
      console.log('🔧 Dev mode: Using simulated tier:', tier);
    } else {
      // 生产模式：验证真实 JWT
      const cookieStore = await cookies();
      const token = cookieStore.get('ae_membership')?.value;
      
      if (!token) {
        return NextResponse.json({
          success: false,
          error: 'unauthorized',
          message: '请先激活会员'
        }, { status: 401 });
      }

      // 验证 JWT
      const { payload } = await jwtVerify(token, JWT_SECRET);
      tier = payload.tier as string;
      userId = payload.userId as string;
    }

    // 获取会员配置
    const gabbyConfig = PERMISSIONS.gabby.getConfig(tier as any);

    // 如果是无限对话
    if (gabbyConfig.dailyLimit === Infinity) {
      return NextResponse.json({
        success: true,
        data: {
          chatCount: 0,
          limit: Infinity,
          remaining: Infinity
        }
      });
    }

    // 获取对话次数
    const key = `chat:${userId}:${lessonId}`;
    let chatCount = 0;
    
    if (isDev) {
      // 开发环境：从内存读取
      chatCount = devChatCounts.get(key) || 0;
    } else {
      // 生产环境：从 Vercel KV 读取
      try {
        chatCount = await kv.get<number>(key) || 0;
      } catch (error) {
        console.error('KV get error:', error);
        chatCount = 0;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        chatCount,
        limit: gabbyConfig.dailyLimit,
        remaining: Math.max(0, gabbyConfig.dailyLimit - chatCount)
      }
    });

  } catch (error) {
    console.error('Get chat usage error:', error);
    return NextResponse.json({
      success: false,
      error: 'server_error',
      message: '服务器错误'
    }, { status: 500 });
  }
}

