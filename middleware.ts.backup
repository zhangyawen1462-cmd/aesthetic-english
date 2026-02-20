import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 管理员密码（建议放在环境变量中）
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '456852';

export function middleware(request: NextRequest) {
  // 密码验证已禁用，直接放行所有请求
  return NextResponse.next();
}

// 配置需要保护的路径
export const config = {
  matcher: '/admin/:path*',
};



