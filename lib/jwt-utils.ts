// ============================================================
// JWT 安全工具 - 统一密钥管理
// ============================================================
// 这是你的"保险箱"，所有 JWT 操作都从这里获取密钥
// 生产环境如果没配置真正的密钥，直接熔断报错

/**
 * 获取 JWT 密钥（带安全校验）
 * @returns Uint8Array 格式的密钥
 * @throws Error 如果生产环境未配置安全密钥
 */
export function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  const isProd = process.env.NODE_ENV === 'production';
  const defaultSecret = 'your-secret-key-change-in-production';

  // 1. 🛑 生产环境熔断机制：没配密钥或用了默认密钥，直接拒绝启动
  if (isProd && (!secret || secret === defaultSecret)) {
    throw new Error('🛑 [FATAL ERROR] 生产环境缺少安全的 JWT_SECRET，服务器拒绝启动！');
  }

  // 2. ⚠️ 开发环境温柔提醒：使用默认值，但给出警告
  if (!secret || secret === defaultSecret) {
    console.warn('⚠️ [DEV WARNING] 本地正在使用默认 JWT_SECRET，请确保线上环境已配置。');
    return new TextEncoder().encode(defaultSecret);
  }

  // 3. ✅ 正常返回强密钥
  return new TextEncoder().encode(secret);
}

/**
 * 验证密钥是否已正确配置（可选的健康检查函数）
 */
export function validateJwtSecret(): boolean {
  try {
    getJwtSecret();
    return true;
  } catch (error) {
    return false;
  }
}










