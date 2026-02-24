import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

// 初始化 Notion 客户端
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const REDEMPTION_LOGS_DB = process.env.NOTION_DB_REDEMPTION_LOGS || '';
const ADMIN_SECRET = 'admin2026'; // 硬编码管理员密钥

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
    // 1. 验证管理员权限
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (token !== ADMIN_SECRET) {
      return NextResponse.json(
        { success: false, message: '未授权访问' },
        { status: 401 }
      );
    }

    // 2. 检查是否配置了日志数据库
    if (!REDEMPTION_LOGS_DB) {
      return NextResponse.json(
        { success: false, message: 'NOTION_DB_REDEMPTION_LOGS 未配置' },
        { status: 500 }
      );
    }

    // 3. 获取查询参数
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status');
    const codeFilter = searchParams.get('code');

    // 4. 构建 Notion 查询过滤器
    const filters: any[] = [];
    
    if (statusFilter) {
      filters.push({
        property: 'Status',
        select: {
          equals: statusFilter
        }
      });
    }
    
    if (codeFilter) {
      filters.push({
        property: 'Attempted Code',
        rich_text: {
          contains: codeFilter
        }
      });
    }

    // 5. 查询 Notion 数据库
    const response = await notion.databases.query({
      database_id: REDEMPTION_LOGS_DB,
      filter: filters.length > 0 ? { and: filters } : undefined,
      sorts: [
        {
          property: 'Time',
          direction: 'descending'
        }
      ],
      page_size: 100 // 最多返回 100 条记录
    });

    // 6. 解析日志数据
    const logs = response.results.map((page: any) => {
      if (!('properties' in page)) return null;
      
      const props = page.properties;
      
      return {
        logId: getPlainText(props['Log ID']),
        code: getPlainText(props['Attempted Code']),
        status: getSelect(props['Status']),
        reason: getPlainText(props['Reason']),
        deviceId: getPlainText(props['Device ID']),
        email: getEmail(props['Email']) || '-',
        time: getDate(props['Time']),
        ipAddress: getPlainText(props['IP Address'])
      };
    }).filter(Boolean);

    // 7. 计算统计数据
    const stats = {
      total: logs.length,
      success: logs.filter(log => log?.status === '🟢 成功').length,
      failed: logs.filter(log => log?.status === '🔴 失败').length
    };

    // 8. 返回数据
    return NextResponse.json({
      success: true,
      data: {
        logs,
        stats
      }
    });

  } catch (error) {
    console.error('获取兑换日志失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: '服务器错误',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}




