import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * 测试端点：检查当前会员状态和 Cookie
 * 访问：GET /api/test-membership
 */
export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('ae_membership')?.value;
  
  // 调用真实的会员验证 API
  const membershipResponse = await fetch(
    `${req.nextUrl.origin}/api/membership`,
    {
      headers: {
        Cookie: `ae_membership=${token || ''}`
      }
    }
  );
  
  const membershipData = await membershipResponse.json();
  
  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    hasCookie: !!token,
    cookiePreview: token ? `${token.substring(0, 20)}...` : null,
    membershipApiResponse: membershipData,
    instructions: {
      step1: '如果 hasCookie 为 true 但 isAuthenticated 为 false，说明验证逻辑正常工作',
      step2: '如果看到 reason: "membership_revoked" 或 "user_not_found"，说明 Notion 验证成功',
      step3: '刷新页面后，Cookie 应该被自动清除',
    }
  });
}

/**
 * 强制清除 Cookie 端点
 * 访问：POST /api/test-membership
 */
export async function POST(req: NextRequest) {
  const response = NextResponse.json({
    success: true,
    message: 'Cookie 已清除',
    timestamp: new Date().toISOString()
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

