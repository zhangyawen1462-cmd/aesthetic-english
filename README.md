# 🎨 Aesthetic English

一个现代化的英语学习平台，结合 AI 自动化内容生成和精美的视觉设计。

---

## ✨ 核心特性

### 🚀 自动化发布系统
- **一键发布**：上传素材 → AI 生成内容 → 自动发布到 Notion
- **智能封面系统**：根据展示位置自动提示需要的封面类型
- **AI 内容生成**：自动生成词汇、语法、回译内容
- **效率提升**：从 20 分钟缩短到 3 分钟

### 🎨 可视化布局管理器
- **拖拽操作**：直观的拖拽界面，所见即所得
- **实时预览**：拖拽过程中实时查看效果
- **完全掌控**：精确控制每个页面显示什么内容
- **零学习成本**：不需要记住复杂的字段和规则

### 🎯 学习模块
- **Script**：字幕阅读
- **Blind**：盲听练习
- **Vocab**：词汇卡片
- **Grammar**：语法笔记
- **Recall**：回译练习
- **Shadow**：跟读录音
- **Salon**：讨论沙龙

### 🎨 设计亮点
- **响应式布局**：完美适配桌面和移动端
- **流畅动画**：Framer Motion 驱动的交互体验
- **双封面系统**：精选页面和归档页面使用不同封面
- **智能排序**：灵活控制内容展示位置和顺序

---

## 🛠️ 技术栈

- **框架**：Next.js 15 (App Router)
- **样式**：Tailwind CSS v4
- **动画**：Framer Motion
- **数据库**：Notion API
- **AI**：DeepSeek API
- **存储**：Cloudflare R2
- **字体**：Verdana + PingFang SC + Georgia

---

## 📦 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env.local` 文件：

```bash
# Notion API
NOTION_API_KEY=secret_xxxxx
NOTION_DB_LESSONS=xxxxx
NOTION_DB_VOCABULARY=xxxxx
NOTION_DB_GRAMMAR=xxxxx
NOTION_DB_RECALL=xxxxx

# DeepSeek AI
DEEPSEEK_API_KEY=sk-xxxxx

# Cloudflare R2
R2_ACCOUNT_ID=xxxxx
R2_ACCESS_KEY_ID=xxxxx
R2_SECRET_ACCESS_KEY=xxxxx
R2_BUCKET_NAME=xxxxx
R2_PUBLIC_URL=https://xxxxx
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:8080](http://localhost:8080)

---

## 📚 文档

- **[自动化发布完整指南](./docs/自动化发布完整指南.md)** - 如何使用一键发布系统
- **[可视化布局管理器使用指南](./docs/可视化布局管理器使用指南.md)** - 拖拽管理页面布局
- **[Notion 数据库配置指南](./docs/Notion数据库配置指南.md)** - 如何配置 Notion 数据库
- **[课程显示控制系统说明](./docs/课程显示控制系统说明.md)** - EP、Display_Position、Sort_Order 详解（已被布局管理器取代）
- **[更新日志](./docs/更新日志.md)** - 设计改进和功能更新

---

## 🎯 主要页面

### 用户端
- `/` - Landing Page
- `/dashboard` - 学习路径选择
- `/daily-cinema` - Daily 精选内容
- `/course/[category]` - 分类课程列表
- `/lesson/[id]` - 课程学习页面
- `/archives` - 所有课程归档

### 管理端
- `/admin` - 管理后台首页
- `/admin/publish` - 一键发布台
- `/admin/layout-manager` - 可视化布局管理器 ⭐ 新增
- `/admin/upload` - 文件上传工具

---

## 📐 封面系统

### 三种使用场景

1. **仅 Archives 视频**
   - 需要：1 张 16:9 归档封面

2. **Dashboard/Daily Cinema 精选**
   - 需要：精选封面（3:4/1:1/9:16）+ 16:9 归档封面

3. **Cognitive/Business 视频**
   - 需要：1 张 16:9 封面（同时用于精选和归档）

---

## 💰 成本估算

- **DeepSeek AI**：约 ¥0.1/月（20期内容）
- **Cloudflare R2**：约 ¥50-200/月（取决于访问量）
- **Notion API**：免费

---

## 🚀 部署

### Vercel 部署（推荐）

1. 推送代码到 GitHub
2. 在 Vercel 导入项目
3. 配置环境变量
4. 部署

### 自定义域名

在 Vercel 项目设置中添加自定义域名。

---

## 📝 开发指南

### 项目结构

```
aesthetic-english/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Landing Page
│   ├── dashboard/         # Dashboard 页面
│   ├── daily-cinema/      # Daily Cinema 页面
│   ├── course/            # 课程列表页面
│   ├── lesson/            # 课程学习页面
│   ├── archives/          # 归档页面
│   ├── admin/             # 管理后台
│   └── api/               # API 路由
├── components/            # React 组件
├── lib/                   # 工具函数
├── types/                 # TypeScript 类型
├── public/                # 静态资源
└── docs/                  # 文档
```

### 添加新功能

1. 在 `app/` 中创建新页面
2. 在 `components/` 中创建新组件
3. 在 `lib/` 中添加工具函数
4. 在 `types/` 中定义类型

---

## 🐛 常见问题

### Q: 视频无法播放？
**A:** 检查文件名是否包含空格，视频格式是否为 MP4

### Q: API 返回 401 错误？
**A:** 检查 Notion API Key 是否正确配置

### Q: 封面显示变形？
**A:** 检查封面尺寸是否与选择的 Cover_Ratio 匹配

更多问题请查看 [自动化发布完整指南](./docs/自动化发布完整指南.md)

---

## 📄 License

MIT

---

## 🙏 致谢

- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [Notion API](https://developers.notion.com/)
- [DeepSeek](https://www.deepseek.com/)
- [Cloudflare R2](https://www.cloudflare.com/products/r2/)

---

**开始使用**：查看 [自动化发布完整指南](./docs/自动化发布完整指南.md) 了解如何发布第一期内容！🚀

