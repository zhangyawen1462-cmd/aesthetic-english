// app/data/lessons.ts

export type Lesson = {
  id: string;        // 课程ID，比如 'coffee-ritual'
  category: 'daily' | 'cognitive' | 'business';
  titleCn: string;   // 中文大标题
  titleEn: string;   // 英文小标题
  coverImg: string;  // 列表页封面图
  videoUrl: string;  // 阿里云 OSS 视频链接
  srtRaw: string;    // 字幕内容
  date: string;      // 发布时间
};

// 这里放你的所有课程数据
export const allLessons: Lesson[] = [
  {
    id: "cheer-01",
    category: "daily",
    titleCn: "达拉斯牛仔圣诞夜",
    titleEn: "Dallas Cowboys Christmas",
    // ⚠️ 记得换成你真实的封面图 URL
    coverImg: "https://aesthetic-assets.oss-cn-hongkong.aliyuncs.com/cover-cheer.jpg", 
    videoUrl: "https://aesthetic-assets.oss-cn-hongkong.aliyuncs.com/allure%E6%8B%89%E6%8B%89%E9%98%9F-%E5%89%AF%E6%9C%AC.mov",
    date: "Feb 09",
    srtRaw: `1
00:00:00,066 --> 00:00:03,100
hi Laura we're the Dallas Cowboys cheerleaders
我们是达拉斯牛仔啦啦队

2
00:00:03,100 --> 00:00:05,666
and welcome to the Cowboys Christmas Extravaganza
欢迎来到牛仔圣诞盛典`
  },
  // --- 明天你想加新课，就在这里复制一份大括号 {} 内容 ---
];