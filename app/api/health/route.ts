// ============================================================
// API Route: 健康检查端点
// ============================================================

import { NextResponse } from 'next/server';

export async function GET() {
  const healthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
    environment: process.env.NODE_ENV || 'development',
    services: {
      notion: !!process.env.NOTION_API_KEY,
      deepseek: !!process.env.DEEPSEEK_API_KEY,
      oss: !!(process.env.OSS_REGION && process.env.OSS_ACCESS_KEY_ID),
    },
  };

  return NextResponse.json(healthStatus);
}


