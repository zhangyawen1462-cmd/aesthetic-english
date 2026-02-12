// ============================================================
// Aesthetic English — 全局类型定义 (Single Source of Truth)
// ============================================================

/** 字幕行（从 SRT 解析而来） */
export interface TranscriptLine {
  id: number;
  start: number;   // 秒（浮点数）
  end: number;     // 秒（浮点数）
  en: string;      // 英文原文
  cn: string;      // 中文翻译
}

/** 词汇卡片 */
export interface VocabCard {
  id: number;
  word: string;
  phonetic: string;
  def: string;       // 英文释义
  defCn?: string;    // 中文释义（可选）
  ex: string;        // 例句
}

/** 语法笔记 */
export interface GrammarNote {
  id: number;
  point: string;     // 语法点标题（中文）
  desc: string;      // 详细解析（中文）
  ex: string;        // 举例
  start: number;     // 关联视频时间戳（秒）
}

/** 中英回译文本 */
export interface RecallText {
  cn: string;
  en: string;
}

/** Salon 模块数据 */
export interface SalonData {
  openingLine?: string;
  bgImage?: string;
  topics?: Array<{
    id: string;
    title: string;
    description: string;
  }>;
}

/**
 * 一期完整课程数据
 *
 * 每一期课程 = allLessons 数组中的一个对象
 * 包含视频、字幕、词汇、语法、回译等全部学习模块所需数据
 */
export interface Lesson {
  id: string;                                    // 唯一标识，如 "cheer-01"
  category: 'daily' | 'cognitive' | 'business';  // 所属板块
  titleCn: string;                               // 中文标题
  titleEn: string;                               // 英文标题
  subtitle?: string;                             // 副标题 / 一句话简介
  ep: string;                                    // 期号，如 "01"
  coverImg: string;                              // 封面图 URL（阿里云 OSS 或本地）
  videoUrl: string;                              // 视频 URL（阿里云 OSS）
  date: string;                                  // 发布日期，如 "Feb 09"

  // ---- 模块数据 ----
  srtRaw: string;                 // 原始 SRT 双语字幕（Script / Shadow 模块使用）
  vocab: VocabCard[];             // 核心词汇（Vocab 模块）
  grammar: GrammarNote[];         // 语法笔记（Grammar 模块）
  recall: RecallText;             // 中英回译（Recall 模块）
  salon?: SalonData;              // Salon 模块（可选）
}

// ---- 笔记类型 ----

/** Notebook 收藏项类型 */
export type NotebookItemType = 'vocabulary' | 'sentence' | 'grammar';

/** Notebook 收藏项 */
export interface CollectedItem {
  id: string;                     // 唯一标识，如 "cheer-01-script-3"
  lessonId: string;               // 来源课程 ID
  type: NotebookItemType;
  content: string;                // 主要内容（单词 / 句子 / 语法点）
  sub?: string;                   // 音标、翻译或来源信息
  note?: string;                  // 用户笔记
  timestamp?: number;             // 关联视频时间戳
  date: string;                   // 收藏日期
  tags?: string[];                // 标签（可选）
}
