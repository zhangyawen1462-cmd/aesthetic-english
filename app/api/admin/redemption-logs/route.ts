import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

// 初始化 Notion 客户端
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const REDEMPTION_LOGS_DB = process.env.NOTION_DB_REDEMPTION_LOGS || '';
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'your-admin-secret-change-in-production';

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

export async function GET(req: NextRequest) {
  try {
    // 🔐 验证管理员权限
    const authHeader = req.headers.get('authorization');
    const adminSecret = authHeader?.replace('Bearer ', '');
    
    if (adminSecret !== ADMIN_SECRET) {
      return NextResponse.json(
        { success: false, error: 'unauthorized', message: '无权访问' },
        { status: 401 }
      );
    }

    if (!REDEMPTION_LOGS_DB) {
      return NextResponse.json(
        { success: false, error: 'not_configured', message: '日志数据库未配置' },
        { status: 500 }
      );
    }

    // 获取查询参数
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const code = searchParams.get('code'); // 按兑换码筛选
    const status = searchParams.get('status'); // 按状态筛选

    // 构建查询条件
    const filter: any = {};
    
    if (code) {
      filter.property = 'Attempted Code';
      filter.rich_text = { contains: code };
    } else if (status) {
      filter.property = 'Status';
      filter.select = { equals: status };
    }

    // 查询日志
    const response = await notion.databases.query({
      database_id: REDEMPTION_LOGS_DB,
      filter: Object.keys(filter).length > 0 ? filter : undefined,
      sorts: [
        {
          property: 'Time',
          direction: 'descending'
        }
      ],
      page_size: Math.min(limit, 100)
    });

    // 解析结果
    const logs = response.results.map((page: any) => {
      if (!('properties' in page)) return null;
      
      const props = page.properties;
      
      return {
        logId: getPlainText(props['Log ID']),
        code: getPlainText(props['Attempted Code']),
        status: getSelect(props['Status']),
        reason: getPlainText(props['Reason']),
        deviceId: getPlainText(props['Device ID']),
        email: getEmail(props['Email']),
        time: getDate(props['Time']),
        ipAddress: getPlainText(props['IP Address'])
      };
    }).filter(Boolean);

    // 统计数据
    const stats = {
      total: logs.length,
      success: logs.filter(log => log?.status === '🟢 成功').length,
      failed: logs.filter(log => log?.status === '🔴 失败').length
    };

    return NextResponse.json({
      success: true,
      data: {
        logs,
        stats
      }
    });

  } catch (error) {
    console.error('Get redemption logs error:', error);
    return NextResponse.json(
      { success: false, error: 'server_error', message: '服务器错误' },
      { status: 500 }
    );
  }
}

