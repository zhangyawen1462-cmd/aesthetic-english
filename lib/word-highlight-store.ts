// 词汇标亮存储管理

const STORAGE_KEY = 'aesthetic-english-word-highlights';

export interface WordHighlight {
  id: string;           // lessonId-lineId-word
  lessonId: string;
  lineId: number;
  word: string;
  timestamp: number;
}

/** 获取所有标亮词汇 */
export function getAllHighlights(): WordHighlight[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/** 获取某课程的标亮词汇 */
export function getHighlightsByLesson(lessonId: string): WordHighlight[] {
  return getAllHighlights().filter(h => h.lessonId === lessonId);
}

/** 切换词汇标亮状态 */
export function toggleWordHighlight(highlight: Omit<WordHighlight, 'timestamp'>): boolean {
  const all = getAllHighlights();
  const index = all.findIndex(h => h.id === highlight.id);
  
  if (index >= 0) {
    // 已存在，删除
    all.splice(index, 1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    return false;
  } else {
    // 不存在，添加
    all.push({ ...highlight, timestamp: Date.now() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    return true;
  }
}

/** 检查词汇是否已标亮 */
export function isWordHighlighted(id: string): boolean {
  return getAllHighlights().some(h => h.id === id);
}

/** 清空某课程的标亮 */
export function clearLessonHighlights(lessonId: string): void {
  const all = getAllHighlights();
  const filtered = all.filter(h => h.lessonId !== lessonId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

