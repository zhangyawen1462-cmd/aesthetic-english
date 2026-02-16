// ============================================================
// 阿里云 OSS 客户端 - 文件上传
// ============================================================

import OSS from 'ali-oss';

// ============================================================
// 文件大小限制配置
// ============================================================
const FILE_SIZE_LIMITS = {
  MAX_FILE_SIZE_MB: 500,           // 最大文件大小 500MB
  MULTIPART_THRESHOLD_MB: 100,     // 分片上传阈值 100MB
  PART_SIZE_MB: 1,                 // 每个分片 1MB
} as const;

// 开发环境日志辅助函数
const isDev = process.env.NODE_ENV === 'development';
const devLog = (...args: any[]) => {
  if (isDev) console.log(...args);
};

// 初始化 OSS 客户端
function getOSSClient() {
  const region = process.env.OSS_REGION;
  const accessKeyId = process.env.OSS_ACCESS_KEY_ID;
  const accessKeySecret = process.env.OSS_ACCESS_KEY_SECRET;
  const bucket = process.env.OSS_BUCKET;

  if (!region || !accessKeyId || !accessKeySecret || !bucket) {
    throw new Error('OSS 配置不完整，请检查环境变量：OSS_REGION, OSS_ACCESS_KEY_ID, OSS_ACCESS_KEY_SECRET, OSS_BUCKET');
  }

  return new OSS({
    region,
    accessKeyId,
    accessKeySecret,
    bucket,
    timeout: 600000,  // 增加到 10 分钟（600秒）
    secure: true,     // 使用 HTTPS
  });
}

/**
 * 上传文件到阿里云 OSS
 * @param file - 文件对象
 * @param folder - 存储文件夹 ('images' | 'videos' | 'srt')
 * @returns 文件的公网访问 URL
 */
export async function uploadToOSS(
  file: File,
  folder: 'images' | 'videos' | 'srt'
): Promise<string> {
  try {
    const client = getOSSClient();

    // 检查文件大小限制
    const fileSizeMB = file.size / 1024 / 1024;
    if (fileSizeMB > FILE_SIZE_LIMITS.MAX_FILE_SIZE_MB) {
      throw new Error(
        `文件过大，最大支持 ${FILE_SIZE_LIMITS.MAX_FILE_SIZE_MB}MB，当前文件大小为 ${fileSizeMB.toFixed(2)}MB`
      );
    }

    // 生成唯一文件名
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const ext = file.name.split('.').pop();
    const filename = `${folder}/${timestamp}-${randomStr}.${ext}`;

    devLog(`📤 开始上传文件: ${file.name} (${fileSizeMB.toFixed(2)} MB)`);

    // 将 File 转换为 Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 根据文件大小选择上传方式
    let result;

    if (fileSizeMB > FILE_SIZE_LIMITS.MULTIPART_THRESHOLD_MB) {
      // 大文件使用分片上传
      devLog('📦 使用分片上传（文件较大）');
      result = await client.multipartUpload(filename, buffer, {
        parallel: 4,
        partSize: FILE_SIZE_LIMITS.PART_SIZE_MB * 1024 * 1024,
        timeout: 600000,
        headers: {
          'Content-Type': file.type,
        },
      });
    } else {
      // 小文件使用普通上传
      devLog('📄 使用普通上传');
      result = await client.put(filename, buffer, {
        timeout: 300000,
      headers: {
        'Content-Type': file.type,
      },
    });
    }

    devLog('✅ OSS 上传成功:', result.url);
    return result.url;
  } catch (error) {
    console.error('❌ OSS 上传失败:', error);
    throw new Error(`文件上传失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 删除 OSS 文件
 * @param url - 文件的完整 URL
 */
export async function deleteFromOSS(url: string): Promise<void> {
  try {
    const client = getOSSClient();
    
    // 从 URL 中提取文件路径
    const urlObj = new URL(url);
    const filename = urlObj.pathname.substring(1); // 去掉开头的 /

    await client.delete(filename);
    devLog('✅ OSS 删除成功:', filename);
  } catch (error) {
    console.error('❌ OSS 删除失败:', error);
    throw new Error(`文件删除失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 批量上传文件
 * @param files - 文件数组
 * @param folder - 存储文件夹
 * @returns 文件 URL 数组
 */
export async function uploadMultipleToOSS(
  files: File[],
  folder: 'images' | 'videos' | 'srt'
): Promise<string[]> {
  const uploadPromises = files.map(file => uploadToOSS(file, folder));
  return Promise.all(uploadPromises);
}


