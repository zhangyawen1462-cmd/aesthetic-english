// ============================================================
// Aesthetic English — 课程数据中心 (Single Source of Truth)
//
// 🔧 管理员添加新课程的步骤：
// 1. 在 allLessons 数组的【最前面】添加一个新对象 {}
// 2. 填写 id, category, ep, titleCn, titleEn 等基本信息
// 3. 将 SRT 字幕文本粘贴到 srtRaw（双语格式：英文\n中文）
// 4. 填写 vocab, grammar, recall 各模块数据
// 5. 保存文件 → 网站自动展示新课程
// ============================================================

import type { Lesson, TranscriptLine, VocabCard, GrammarNote, RecallText, SalonData } from "./types";

// Re-export types for convenience
export type { Lesson, TranscriptLine, VocabCard, GrammarNote, RecallText, SalonData } from "./types";

export const allLessons: Lesson[] = [

  // ──────────────────────────────────────────────────────────
  // 🎯 Cognitive EP.01 — 5 Tips to guide you speaking like a CEO
  // ──────────────────────────────────────────────────────────
  {
    id: "ceo-speaking-01",
    category: "cognitive",
    ep: "01",
    titleCn: "如何向CEO一样表达思考？",
    titleEn: "5 Tips to guide you speaking like a CEO",
    subtitle: "Master executive communication strategies.",
    coverImg: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop",
    videoUrl: "https://aesthetic-assets.oss-cn-hongkong.aliyuncs.com/allure%E6%8B%89%E6%8B%89%E9%98%9F-%E5%89%AF%E6%9C%AC.mov",
    date: "Feb 12",

    srtRaw: `1
00:00:00,066 --> 00:00:02,500
Tip number one: Be concise and direct.
第一条建议：简洁直接。

2
00:00:02,600 --> 00:00:05,500
CEOs value clarity over complexity.
CEO们重视清晰胜过复杂。

3
00:00:05,600 --> 00:00:08,500
Get to the point quickly and efficiently.
快速高效地切入重点。`,

    vocab: [
      { id: 1, word: "concise", phonetic: "/kənˈsaɪs/", def: "brief and clear", defCn: "简洁的", ex: "Keep your message concise." },
      { id: 2, word: "clarity", phonetic: "/ˈklærəti/", def: "the quality of being clear", defCn: "清晰", ex: "Clarity is key in communication." },
    ],

    grammar: [
      { id: 1, point: "Value A over B", desc: "表示更重视A而非B", ex: "CEOs value clarity over complexity.", start: 2.6 },
    ],

    recall: {
      cn: "第一条建议：简洁直接。CEO们重视清晰胜过复杂。",
      en: "Tip number one: Be concise and direct. CEOs value clarity over complexity.",
    },

    salon: {
      openingLine: "Executive Communication Strategies",
      topics: [
        { id: "1", title: "Concise Communication", description: "How do you practice concise communication?" },
        { id: "2", title: "Executive Presence", description: "What makes a CEO's speech effective?" },
      ],
    },
  },

  // ──────────────────────────────────────────────────────────
  // 🎬 Daily EP.01 — 达拉斯牛仔圣诞夜
  // ──────────────────────────────────────────────────────────
  {
    id: "cheer-01",
    category: "daily",
    ep: "01",
    titleCn: "达拉斯牛仔圣诞夜",
    titleEn: "Dallas Cowboys Christmas",
    subtitle: "The art of performing under the spotlight.",
    coverImg: "https://aesthetic-assets.oss-cn-hongkong.aliyuncs.com/cover-cheer.jpg",
    videoUrl: "https://aesthetic-assets.oss-cn-hongkong.aliyuncs.com/allure%E6%8B%89%E6%8B%89%E9%98%9F-%E5%89%AF%E6%9C%AC.mov",
    date: "Feb 09",

    srtRaw: `1
00:00:00,066 --> 00:00:02,500
Hi Laura, we're the Dallas Cowboys Cheerleaders.
嗨 Laura，我们是达拉斯牛仔啦啦队。

2
00:00:02,600 --> 00:00:05,500
And welcome to the Cowboys Christmas Extravaganza!
欢迎来到牛仔圣诞盛典！

3
00:00:05,600 --> 00:00:08,500
We are so excited to have you here today.
我们非常兴奋能邀请你来到现场。

4
00:00:08,600 --> 00:00:12,000
This city is a symphony of secrets after midnight.
午夜后的这座城市，是一首秘密的交响曲。

5
00:00:12,100 --> 00:00:15,000
Tell me, what brings you to this side of the velvet rope?
告诉我，是什么风把你吹到了天鹅绒围栏的这一边？

6
00:00:15,100 --> 00:00:18,000
Fashion is not just about clothes, it's about attitude.
时尚不仅仅是衣服，更是态度。`,

    vocab: [
      { id: 1, word: "Discipline", phonetic: "/ˈdɪs.ə.plɪn/", def: "The practice of training people to obey rules.", ex: "It is about the discipline behind the smile." },
      { id: 2, word: "Precision", phonetic: "/prɪˈsɪʒ.ən/", def: "The quality of being accurate and exact.", ex: "Every move requires absolute precision." },
      { id: 3, word: "Aesthetics", phonetic: "/esˈθet.ɪks/", def: "A set of principles concerned with nature and appreciation of beauty.", ex: "This is the aesthetics of power." },
    ],

    grammar: [
      { id: 1, point: "系表结构与身份界定", desc: "Linking Verb (be) 连接主语与表语。在本句语境中，'We are...' 不仅是陈述事实，更是一种群体身份的强烈宣告 (Identity Declaration)。", ex: "Ex: She is a dancer. (主语 + be + 名词)", start: 0.1 },
      { id: 2, point: "隐喻 (Metaphor) 的通感", desc: "将视觉/空间概念 (City) 转化为听觉概念 (Symphony)。'Symphony' 暗示了混乱中的有序 (Ordered Chaos)，将城市的喧嚣升华为宏大的乐章。", ex: "Ex: The city is a symphony. (A is B)", start: 8.6 },
      { id: 3, point: "平行否定结构", desc: "'Not just A, but B' 的口语变体。通过省略连词 'but'，增加了句子的断裂感和力量感。", ex: "Ex: It's not just clothes, it's attitude.", start: 15.1 },
      { id: 4, point: "象征意象：Velvet Rope", desc: "Velvet Rope (天鹅绒围栏) 是排他性 (Exclusivity) 和特权 (Privilege) 的物理象征。", ex: "Ex: Beyond the velvet rope lies the VIP area.", start: 12.1 },
    ],

    recall: {
      cn: "午夜后的这座城市，是一首秘密的交响曲。时尚不仅仅是衣服，更是态度。告诉我，是什么风把你吹到了天鹅绒围栏的这一边？我们要为这一刻带来光彩，因为在这里，每一束聚光灯都在等待主角的登场。",
      en: "This city is a symphony of secrets after midnight. Fashion is not just about clothes, it's about attitude. Tell me, what brings you to this side of the velvet rope? We are here to bring the sparkle to the moment, because here, every spotlight is waiting for its lead.",
    },

    salon: {
      openingLine: "Waiting for curation...",
    },
  },

  // ──────────────────────────────────────────────────────────
  // 🧠 Cognitive EP.01 — 心流：深度专注的艺术（示例数据）
  // ──────────────────────────────────────────────────────────
  {
    id: "flow-01",
    category: "cognitive",
    ep: "01",
    titleCn: "心流：深度专注的艺术",
    titleEn: "Flow: The Art of Deep Focus",
    subtitle: "Entering the zone of pure thought.",
    coverImg: "/images/cognitive-text.jpg",
    videoUrl: "",  // ⚠️ 待上传视频
    date: "Feb 10",

    srtRaw: `1
00:00:00,000 --> 00:00:03,500
Flow is the mental state where you are fully immersed.
心流是你完全沉浸其中的精神状态。

2
00:00:03,600 --> 00:00:07,000
Time seems to disappear when you reach this state.
当你达到这种状态时，时间似乎消失了。

3
00:00:07,100 --> 00:00:10,500
The key is to find the balance between challenge and skill.
关键是找到挑战与技能之间的平衡。`,

    vocab: [
      { id: 1, word: "Immersed", phonetic: "/ɪˈmɜːrst/", def: "Deeply involved in an activity.", ex: "She was completely immersed in her work." },
      { id: 2, word: "Consciousness", phonetic: "/ˈkɒn.ʃəs.nəs/", def: "The state of being aware of one's surroundings.", ex: "Flow alters your consciousness." },
    ],

    grammar: [
      { id: 1, point: "where 引导的定语从句", desc: "用 where 修饰抽象名词 'state'，将心理状态比作一个空间位置。", ex: "Ex: Flow is the state where you lose track of time.", start: 0 },
    ],

    recall: {
      cn: "心流是你完全沉浸其中的精神状态。当你达到这种状态时，时间似乎消失了。关键是找到挑战与技能之间的平衡。",
      en: "Flow is the mental state where you are fully immersed. Time seems to disappear when you reach this state. The key is to find the balance between challenge and skill.",
    },
  },

  // ──────────────────────────────────────────────────────────
  // 💼 Business EP.01 — 谈判的艺术（示例数据）
  // ──────────────────────────────────────────────────────────
  {
    id: "negotiate-01",
    category: "business",
    ep: "01",
    titleCn: "谈判的艺术",
    titleEn: "The Art of Negotiation",
    subtitle: "Win without war.",
    coverImg: "/images/business-elite.jpg",
    videoUrl: "",  // ⚠️ 待上传视频
    date: "Feb 10",

    srtRaw: `1
00:00:00,000 --> 00:00:03,800
A great negotiator listens more than they speak.
一个出色的谈判者倾听多于说话。

2
00:00:03,900 --> 00:00:07,200
The goal is not to win, but to find a solution.
目标不是赢，而是找到解决方案。

3
00:00:07,300 --> 00:00:10,500
Silence is your most powerful tool at the table.
沉默是你在谈判桌上最有力的工具。`,

    vocab: [
      { id: 1, word: "Leverage", phonetic: "/ˈlev.ər.ɪdʒ/", def: "The power to influence a situation.", ex: "Use your leverage wisely in any deal." },
      { id: 2, word: "Concession", phonetic: "/kənˈseʃ.ən/", def: "Something given up to reach an agreement.", ex: "Making small concessions builds trust." },
    ],

    grammar: [
      { id: 1, point: "比较级结构 more...than", desc: "'listens more than they speak' 通过比较级结构强调「倾听」在谈判中的优先级。", ex: "Ex: She reads more than she watches TV.", start: 0 },
    ],

    recall: {
      cn: "一个出色的谈判者倾听多于说话。目标不是赢，而是找到解决方案。沉默是你在谈判桌上最有力的工具。",
      en: "A great negotiator listens more than they speak. The goal is not to win, but to find a solution. Silence is your most powerful tool at the table.",
    },
  },

  // ── 添加新课程时，复制上方任一块 {} 到这里的前面即可 ──
];


// ============================================================
// 🔧 辅助查询函数 (Helper Functions)
// ============================================================

/** 根据 ID 查找课程 */
export function getLessonById(id: string): Lesson | undefined {
  return allLessons.find(l => l.id === id);
}

/** 获取某个板块的所有课程（按数组顺序，即最新的在前） */
export function getLessonsByCategory(category: string): Lesson[] {
  return allLessons.filter(l => l.category === category);
}

/** 获取某个板块的最新 N 期 */
export function getLatestLessons(category: string, count: number = 5): Lesson[] {
  return getLessonsByCategory(category).slice(0, count);
}
