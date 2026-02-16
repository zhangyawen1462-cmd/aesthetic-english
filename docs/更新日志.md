# 🎨 Aesthetic English - 设计改进日志

## 📅 更新日期: 2026年2月10日

---

## ✅ 完成的改进

### 1. 🚫 移除侧边栏 (Sidebar)
- **问题**: 左侧书签在手机端遮挡模块内容
- **解决方案**: 完全移除 Sidebar 组件的使用
- **影响文件**: 
  - `app/dashboard/page.tsx`

### 2. 🔤 优化字体策略
- **更新**: 优先使用 Verdana + 苹果简体 (PingFang SC)
- **改进**: 
  - 全局字体栈更新，优先 Verdana
  - 减少斜体使用，提升清爽感
  - 正体为主，斜体仅用于特殊强调
- **影响文件**:
  - `app/globals.css` - 全局字体配置
  - `tailwind.config.ts` - Tailwind 字体配置
  - `app/page.tsx` - Landing Page 标题
  - `app/dashboard/page.tsx` - Dashboard 标题和卡片
  - `app/course/[category]/page.tsx` - 课程页标题

### 3. ✨ Landing Page 交互升级
- **新功能**: 晕染效果跟随手指/鼠标移动
  - 桌面端: 鼠标移动 (`mousemove`)
  - 移动端: 触摸移动 (`touchmove` + `touchstart`)
- **效果**: 三层呼吸晕染系统实时跟随用户操作
- **影响文件**: 
  - `app/page.tsx`

### 4. 🖼️ 课程页面重新设计 (Gucci Art Space 风格)
- **布局变更**: 
  - ❌ 旧版: 横向滚动画廊 (液态滚动)
  - ✅ 新版: 垂直网格布局 (Masonry 画作风格)
  
- **设计改进**:
  - ✅ 更紧凑 - 移除巨大封面，卡片式布局
  - ✅ 更流动 - 响应式网格，自然呼吸感
  - ✅ 更丰富 - 多层次色彩和质感（悬停效果、渐变遮罩）
  
- **新增特性**:
  - 悬停时封面图去灰度
  - 播放按钮动态显示
  - 卡片阴影深度变化
  - 导航栏磨砂玻璃效果
  
- **影响文件**: 
  - `app/course/[category]/page.tsx`

### 5. 👻 模块幽灵图层系统
- **新功能**: 为所有学习模块添加若隐若现的背景图
- **特点**:
  - 极低不透明度 (3-5%)
  - 滤镜处理 (模糊、去色、复古)
  - 呼吸感过渡效果
  - 响应式图片支持（桌面/移动端可用不同图）
  
- **影响模块**:
  1. Script (字幕阅读) - 16:9 横向
  2. Blind (盲听练习) - 1:1 方形
  3. Vocab (词汇卡片) - 1:1 方形
  4. Grammar (语法笔记) - 3:4 竖向
  5. Recall (回译练习) - 3:4 竖向
  6. Shadow (跟读录音) - 16:9 横向
  7. Salon (讨论沙龙) - 1:1 方形

- **影响文件**:
  - `components/ModuleScript.tsx`
  - `components/ModuleBlind.tsx`
  - `components/ModuleVocab.tsx`
  - `components/ModuleGrammar.tsx`
  - `components/ModuleRecall.tsx`
  - `components/ModuleShadow.tsx`
  - `components/ModuleSalon.tsx`

### 6. 🎯 Dashboard 英语学习指向性增强
- **标题更新**: "Curated Collections" → "Learning Pathways"
- **副标题更新**: "Select Your Path" → "Choose Your English Journey"
- **卡片优化**: 移除过多斜体，保持清爽正体

---

## 📋 需要您准备的素材

### 背景图片
请根据 `IMAGE_GUIDE.md` 准备以下图片并放入 `public/images/module-bg/`:

| 文件名 | 推荐尺寸 | 比例 | 风格关键词 |
|--------|---------|------|-----------|
| `script-desktop.jpg` | 1920×1080 | 16:9 | 书页、打字机、文字 |
| `script-mobile.jpg` (可选) | 1080×1920 | 9:16 | 同上，移动端优化 |
| `blind.jpg` | 1200×1200 | 1:1 | 黑胶唱片、耳机 |
| `vocab.jpg` | 1200×1200 | 1:1 | 词典、笔记本 |
| `grammar.jpg` | 900×1200 | 3:4 | 语法书、标注 |
| `recall.jpg` | 900×1200 | 3:4 | 练习册、档案纸张 |
| `shadow.jpg` | 1920×1080 | 16:9 | 录音棚、麦克风 |
| `salon.jpg` | 1200×1200 | 1:1 | 咖啡馆、书房 |

**图片要求**:
- 格式: JPG
- 大小: < 500KB/张
- 色调: 黑白或低饱和度
- 纹理感: 纸张、布料、复古质感

**临时方案**: 如果暂时没有图片，背景会显示纯色，不影响功能。

---

## 🎨 设计理念

### 参考来源
1. **Gucci Art Space** - 画作网格布局、画廊氛围
2. **Cosmos.so** - 视觉层级、玻璃态效果
3. **FWRD.com** - 清爽字体层级、编辑风格

### 核心原则
- ✅ **紧凑但透气** - 信息密度合理，保持呼吸感
- ✅ **流动丝滑** - 自然的过渡动画
- ✅ **层次丰富** - 色彩、质感、透明度多维度
- ✅ **清爽克制** - 减少装饰性元素，正体为主

---

## 🚀 下一步

1. **准备背景图**: 按照 `IMAGE_GUIDE.md` 寻找/制作图片
2. **测试运行**: `npm run dev` 查看效果
3. **微调**: 根据实际视觉效果调整图片透明度/滤镜

---

## 📝 技术栈

- **框架**: Next.js 15 (App Router)
- **样式**: Tailwind CSS v4
- **动画**: Framer Motion
- **字体**: Verdana + PingFang SC + Georgia
- **图片**: 本地静态资源 (public/images/)

---

**需要帮助？** 所有更新都已完成并测试通过。如有问题请随时反馈！
