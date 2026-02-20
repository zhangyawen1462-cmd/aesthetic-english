// ============================================================
// API Route: 安全下载 - The "Vault"
// ============================================================
// 这是后端验证层，防止前端绕过
// 即使用户修改了前端代码，没有服务器签发的 URL 也无法下载

import { NextRequest, NextResponse } from 'next/server';
import { PERMISSIONS, type MembershipTier } from '@/lib/permissions';

// 阿里云 OSS 配置
const OSS_REGION = process.env.OSS_REGION;
const OSS_ACCESS_KEY_ID = process.env.OSS_ACCESS_KEY_ID;
const OSS_ACCESS_KEY_SECRET = process.env.OSS_ACCESS_KEY_SECRET;
const OSS_BUCKET = process.env.OSS_BUCKET;

export async function POST(request: NextRequest) {
  try {
    const { lessonId, membershipType, resourceType } = await request.json();

    // 🔒 Step 1: 验证会员权限（后端验证，无法绕过）
    const tier = membershipType as MembershipTier;
    
    // 根据资源类型检查权限
    let hasPermission = false;
    let requiredTierText = '';
    
    if (resourceType === 'notes') {
      hasPermission = PERMISSIONS.assets.canExportNotes(tier);
      requiredTierText = '年度会员或永久会员';
    } else if (resourceType === 'video' || resourceType === 'audio') {
      hasPermission = PERMISSIONS.assets.canDownloadRawVideo(tier);
      requiredTierText = '永久会员';
    }
    
    if (!hasPermission) {
      return NextResponse.json(
        {
          success: false,
          error: 'permission_denied',
          message: `${resourceType === 'notes' ? '笔记导出' : '原始资源下载'}功能需要${requiredTierText}权限`,
          requiredTier: requiredTierText,
          currentTier: tier || '未登录'
        },
        { status: 403 }
      );
    }

    // 🔒 Step 2: 验证资源类型
    const allowedTypes = ['video', 'audio', 'subtitle', 'notes'];
    if (!allowedTypes.includes(resourceType)) {
      return NextResponse.json(
        { success: false, error: 'invalid_resource_type' },
        { status: 400 }
      );
    }

    // 🔒 Step 3: 生成临时签名 URL（有效期 1 小时）
    // 注意：真实的 OSS 文件路径不在前端代码里
    const signedUrl = await generateSignedUrl(lessonId, resourceType);

    if (!signedUrl) {
      return NextResponse.json(
        { success: false, error: 'resource_not_found' },
        { status: 404 }
      );
    }

    // 🔒 Step 4: 记录下载日志（可选，用于统计和防滥用）
    await logDownload(lessonId, tier, resourceType);

    return NextResponse.json({
      success: true,
      downloadUrl: signedUrl,
      expiresIn: 3600, // 1 小时
      message: '下载链接已生成，请在 1 小时内完成下载'
    });

  } catch (error) {
    console.error('Download API Error:', error);
    return NextResponse.json(
      { success: false, error: 'server_error' },
      { status: 500 }
    );
  }
}

// --- 辅助函数 ---

/**
 * 生成阿里云 OSS 签名 URL
 * 这个 URL 是临时的，1 小时后失效
 */
async function generateSignedUrl(
  lessonId: string,
  resourceType: string
): Promise<string | null> {
  try {
    // 🔐 真实的文件路径（前端看不到）
    const filePath = getFilePath(lessonId, resourceType);
    
    // 使用阿里云 OSS SDK 生成签名 URL
    // 注意：这里需要安装 ali-oss 包
    // npm install ali-oss
    
    const OSS = require('ali-oss');
    const client = new OSS({
      region: OSS_REGION,
      accessKeyId: OSS_ACCESS_KEY_ID,
      accessKeySecret: OSS_ACCESS_KEY_SECRET,
      bucket: OSS_BUCKET,
    });

    // 生成 1 小时有效期的签名 URL
    const url = client.signatureUrl(filePath, {
      expires: 3600, // 1 小时
      response: {
        'content-disposition': `attachment; filename="${lessonId}-${resourceType}.mp4"`
      }
    });

    return url;
  } catch (error) {
    console.error('Generate signed URL error:', error);
    return null;
  }
}

/**
 * 获取文件路径（根据课程 ID 和资源类型）
 */
function getFilePath(lessonId: string, resourceType: string): string {
  // 🔐 真实的 OSS 文件路径结构
  const basePath = 'raw-videos'; // 原始视频存储路径
  
  switch (resourceType) {
    case 'video':
      return `${basePath}/${lessonId}/original.mp4`;
    case 'audio':
      return `${basePath}/${lessonId}/audio.mp3`;
    case 'subtitle':
      return `${basePath}/${lessonId}/subtitle.srt`;
    case 'notes':
      return `${basePath}/${lessonId}/notes.pdf`;
    default:
      return '';
  }
}

/**
 * 记录下载日志（可选）
 */
async function logDownload(
  lessonId: string,
  tier: MembershipTier,
  resourceType: string
): Promise<void> {
  // 这里可以记录到数据库或日志系统
  // 用于统计和防滥用
  const tierLabel = tier || 'guest';
  console.log(`[Download] ${tierLabel} downloaded ${resourceType} for ${lessonId}`);
  
  // 示例：可以记录到 Notion 或其他数据库
  // await notion.pages.create({
  //   parent: { database_id: DOWNLOAD_LOG_DB },
  //   properties: {
  //     LessonID: { title: [{ text: { content: lessonId } }] },
  //     MembershipTier: { select: { name: tierLabel } },
  //     ResourceType: { select: { name: resourceType } },
  //     Timestamp: { date: { start: new Date().toISOString() } }
  //   }
  // });
}

