import type { CollectedItem } from "@/data/types";

const STORAGE_KEY = "aesthetic_notebook_v1";

/** 获取所有收藏项 */
export function getNotebook(): CollectedItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** 添加收藏（最新的放最前面） */
export function addToNotebook(item: CollectedItem): void {
  const items = getNotebook();
  if (items.some(i => i.id === item.id)) return;
  items.unshift(item);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

/** 移除收藏 */
export function removeFromNotebook(id: string): void {
  const items = getNotebook().filter(i => i.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

/** 检查是否已收藏 */
export function isInNotebook(id: string): boolean {
  return getNotebook().some(i => i.id === id);
}

/** 切换收藏状态，返回新状态（true = 已收藏） */
export function toggleNotebook(item: CollectedItem): boolean {
  if (isInNotebook(item.id)) {
    removeFromNotebook(item.id);
    return false;
  } else {
    addToNotebook(item);
    return true;
  }
}

/** 获取某个课程下的所有收藏 */
export function getNotebookByLesson(lessonId: string): CollectedItem[] {
  return getNotebook().filter(i => i.lessonId === lessonId);
}

/** 按类型筛选收藏 */
export function getNotebookByType(type: CollectedItem['type']): CollectedItem[] {
  return getNotebook().filter(i => i.type === type);
}
