// ============================================================
// 开发环境共享存储 - 替代 Vercel KV
// ============================================================

// 🔧 开发环境：使用全局单例模式，防止 Next.js 热更新时内存丢失
const globalForChat = globalThis as unknown as {
  devChatCounts: Map<string, number> | undefined;
};

// 如果全局对象里有，就用旧的（保留记忆）；如果没有，才创建一个新的
const devChatCounts = globalForChat.devChatCounts ?? new Map<string, number>();

// 仅在开发环境下将其挂载到全局
if (process.env.NODE_ENV !== 'production') {
  globalForChat.devChatCounts = devChatCounts;
}

export function getDevChatCount(key: string): number {
  return devChatCounts.get(key) || 0;
}

export function incrementDevChatCount(key: string): number {
  const currentCount = devChatCounts.get(key) || 0;
  const newCount = currentCount + 1;
  devChatCounts.set(key, newCount);
  return newCount;
}

export function setDevChatCount(key: string, count: number): void {
  devChatCounts.set(key, count);
}

export function clearDevChatCount(key: string): void {
  devChatCounts.delete(key);
}

