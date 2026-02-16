// ============================================================
// 工具函数集合
// ============================================================

/**
 * 将 OSS 原始 URL 自动转换为 CDN URL
 * @param url - 原始 URL（可能是 OSS 或 CDN 或外链）
 * @returns 标准化后的 CDN URL
 */
export function normalizeCdnUrl(url: string | null | undefined): string {
  // 如果 URL 为空或不是字符串，返回空字符串
  if (!url || typeof url !== 'string') return '';
  
  // 去除首尾空格
  url = url.trim();
  if (!url) return '';
  
  // 定义旧域名和新域名
  const OLD_OSS_DOMAIN = 'aesthetic-assets.oss-cn-hongkong.aliyuncs.com';
  const NEW_CDN_DOMAIN = 'assets.aestheticenglish.com';
  
  // 如果包含旧的 OSS 域名，替换为 CDN 域名
  if (url.includes(OLD_OSS_DOMAIN)) {
    url = url.replace(OLD_OSS_DOMAIN, NEW_CDN_DOMAIN);
  }
  
  // 强制使用 https://（修复 http:// 的问题）
  if (url.includes(NEW_CDN_DOMAIN) && url.startsWith('http://')) {
    url = url.replace('http://', 'https://');
  }
  
  return url;
}

/**
 * 批量标准化对象中的所有 URL 字段
 * @param obj - 包含 URL 字段的对象
 * @param urlFields - 需要标准化的字段名数组
 * @returns 标准化后的对象
 */
export function normalizeObjectUrls<T extends Record<string, any>>(
  obj: T,
  urlFields: (keyof T)[]
): T {
  const normalized = { ...obj };
  
  for (const field of urlFields) {
    if (typeof normalized[field] === 'string') {
      normalized[field] = normalizeCdnUrl(normalized[field] as string) as any;
    }
  }
  
  return normalized;
}

/**
 * 深度标准化对象中的所有 URL（递归处理嵌套对象和数组）
 * @param obj - 任意对象
 * @returns 标准化后的对象
 */
export function deepNormalizeCdnUrls<T>(obj: T): T {
  if (!obj) return obj;
  
  // 如果是字符串，尝试标准化
  if (typeof obj === 'string') {
    return normalizeCdnUrl(obj) as any;
  }
  
  // 如果是数组，递归处理每个元素
  if (Array.isArray(obj)) {
    return obj.map(item => deepNormalizeCdnUrls(item)) as any;
  }
  
  // 如果是对象，递归处理每个属性
  if (typeof obj === 'object') {
    const normalized: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        normalized[key] = deepNormalizeCdnUrls(obj[key]);
      }
    }
    return normalized;
  }
  
  return obj;
}

