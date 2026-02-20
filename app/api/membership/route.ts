import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { kv } from '@vercel/kv';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies(); // 🆕 Next.js 15+ 需要 await
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
    
    const tier = payload.tier as string;
    const userId = payload.userId as string;
    const email = payload.email as string;

    // 转换为中文标签
    const tierLabels: Record<string, string> = {
      'quarterly': '季度会员',
      'yearly': '年度会员',
      'lifetime': '永久会员'
    };

    return NextResponse.json({
      success: true,
      data: {
        isAuthenticated: true,
        tier,
        tierLabel: tierLabels[tier] || '访客',
        userId,
        email,
        activatedAt: payload.activatedAt
      }
    });

  } catch (error) {
    console.error('Get membership error:', error);
    
    // Token 无效，清除 Cookie
    const cookieStore = await cookies(); // 🆕 Next.js 15+ 需要 await
    cookieStore.delete('ae_membership');
    
    return NextResponse.json({
      success: true,
      data: {
        isAuthenticated: false,
        tier: null,
        tierLabel: '访客'
      }
    });
  }
}

