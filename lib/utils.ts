import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * 合并 Tailwind CSS 类名
 * 用于处理条件类名和避免冲突
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 标准化 CDN URL
 * 处理 Notion 图片 URL 或其他 CDN 链接
 * @param url - 原始 URL
 * @returns 标准化后的 URL
 */
export function normalizeCdnUrl(url: string): string {
  if (!url) return '';
  
  // 如果是 Notion 图片 URL，保持原样
  if (url.includes('notion.so') || url.includes('amazonaws.com')) {
    return url;
  }
  
  // 如果是相对路径，保持原样
  if (url.startsWith('/')) {
    return url;
  }
  
  // 如果是完整 URL，保持原样
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // 其他情况，添加 / 前缀
  return `/${url}`;
}
