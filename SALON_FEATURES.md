# 🎭 Salon 模块完整功能说明

## ✨ 已实现的功能

### 1. 三种 AI 模式切换

#### 💼 Professional Mode（专业模式）
- **适用场景**：商业英语、职场沟通
- **AI 人格**：正式、精准、商务导向
- **背景样式**：深色纹理背景（`/images/chat-bg/business.jpg`）
- **温度参数**：0.7（稳定输出）
- **开场白示例**：
  > "I see you're studying 'XXX'. Let's focus on the professional vocabulary. What business expressions caught your attention?"

#### 👑 Arrogant Mode（挑战模式）
- **适用场景**：高强度训练、突破舒适区
- **AI 人格**：挑衅、严格、高标准
- **背景样式**：深色渐变背景
- **温度参数**：0.9（更有个性）
- **开场白示例**：
  > "So, you're watching 'XXX'. Do you really think you can handle this level of vocabulary? Prove it."

#### 🌹 Romantic Mode（感性模式）
- **适用场景**：认知成长、深度思辨
- **AI 人格**：诗意、哲学、情感智能
- **背景样式**：温暖渐变背景
- **温度参数**：0.85（富有表现力）
- **开场白示例**：
  > "The atmosphere in 'XXX' is intoxicating, isn't it? Tell me, what emotions does this evoke for you?"

---

### 2. 会员权限差异化

| 功能 | 季度会员 | 年度会员 | 永久会员 |
|------|---------|---------|---------|
| 输入消息 | ✅ | ✅ | ✅ |
| 查看 AI 回复 | ⚠️ 模糊 | ✅ 清晰 | ✅ 清晰 |
| Better Way 纠错 | ❌ | ✅ | ✅ |
| 模式切换 | ❌ | ❌ | ✅ |
| 每日消息数 | 3 条 | 20 条 | 无限 |

#### 🔒 季度会员的"幽灵输入"体验
- 可以输入和发送消息
- AI 会"回复"，但内容是**模糊的**
- 显示锁图标 + "Upgrade to View" 提示
- **心理学设计**：让用户尝到甜头但看不清，促进升级

---

### 3. 智性反馈系统（Better Way）

- AI 回复中如果包含纠错建议，会显示 **"Better Way"** 胶囊
- 点击展开查看更优雅的表达方式
- 带 Sparkles 图标和平滑动画
- 仅对年度/永久会员显示

**提取逻辑**：
```typescript
// API 会自动从 AI 回复中提取纠正建议
const correctionPatterns = [
  /(?:better way|you could say|natives say):?\s*"([^"]+)"/i,
  /(?:instead of|rather than).*?try:?\s*"([^"]+)"/i,
];
```

---

### 4. 基于视频内容的上下文对话

每次对话都会携带：
- **视频标题**（中英文）
- **完整字幕**（前 1000 字符）
- **核心词汇表**（单词 + 释义）
- **对话历史**（保持上下文连贯）

AI 会：
- 自然引用视频内容
- 鼓励使用视频中的词汇
- 根据视频主题调整对话方向

---

## 🎨 UI/UX 特点

### Instagram DM 风格
- **顶部栏**：Gabby 头像 + 在线状态 + 模式图标
- **消息气泡**：
  - 用户消息：右对齐，主题色背景，右下角切角
  - AI 消息：左对齐，极淡背景，左下角切角
- **时间戳**：9px 超小字体，30% 透明度
- **模式切换器**：右上角刷新图标，点击展开模式选择面板

### 动画效果
- 消息进入：`opacity + y + scale` 组合动画
- Better Way 展开：高度动画
- 加载指示器：3 个跳动的圆点（错开延迟）
- 按钮点击：`scale(0.95)` 反馈
- 模式切换面板：淡入 + 缩放动画

---

## 🔧 技术实现

### 前端（ModuleSalon.tsx）

```typescript
// 模式配置
const AI_MODES = {
  professional: { name, icon, description, systemPrompt, openingHook },
  arrogant: { ... },
  romantic: { ... }
};

// 状态管理
const [currentMode, setCurrentMode] = useState<AIMode>('professional');
const [messages, setMessages] = useState<Message[]>([]);
const [membershipType] = useState(() => localStorage.getItem('membershipType'));

// 权限判断
const hasAccess = membershipType === '年度会员' || membershipType === '永久会员';
const canSwitchMode = membershipType === '永久会员';
```

### 后端（/api/ai-chat/route.ts）

```typescript
// 接收参数
const { message, mode, systemPrompt, videoContext, conversationHistory } = await request.json();

// 构建增强提示词
const enhancedSystemPrompt = `${systemPrompt}

VIDEO CONTEXT:
Title: ${videoContext.title}
Transcript: ${videoContext.transcript}
Key Vocabulary: ${videoContext.vocabulary}

INSTRUCTIONS:
1. Reference the video content naturally
2. Help practice vocabulary from the video
3. Provide gentle corrections
4. Keep responses concise (2-4 sentences)
5. Stay in character based on mode (${mode})
`;

// 调用 DeepSeek API
const response = await fetch(DEEPSEEK_API_URL, {
  body: JSON.stringify({
    model: 'deepseek-chat',
    messages: [
      { role: 'system', content: enhancedSystemPrompt },
      ...conversationHistory,
      { role: 'user', content: message }
    ],
    temperature: mode === 'arrogant' ? 0.9 : mode === 'romantic' ? 0.85 : 0.7,
    max_tokens: 300,
  }),
});

// 返回结果
return NextResponse.json({
  success: true,
  reply: aiReply,
  correction: extractedCorrection, // 自动提取的纠错建议
  mode: mode,
});
```

---

## 📝 待完成的任务

### 1. 添加聊天背景图片

需要在 `public/images/chat-bg/` 目录下添加：
- `business.jpg` - 商业模式背景（深色纹理）
- 或者使用现有的 `businessbg_横屏.avif`

**临时方案**：
```typescript
// 如果没有专门的背景图，可以复用现有图片
backgroundImage: 'url(/images/businessbg_横屏.avif)'
```

### 2. 添加 Gabby 头像

当前使用渐变色占位符：
```typescript
<div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400">
  G
</div>
```

**建议**：
- 设计一个 Gabby 的头像图标
- 或使用 AI 生成的头像
- 放在 `public/images/gabby-avatar.png`

### 3. 优化模糊消息生成

当前使用固定文本：
```typescript
content: "That is an interesting perspective. However, in a professional context..."
```

**改进方案**：
- 生成随机长度的假文本
- 或调用 API 但只返回前 50 个字符
- 增加真实感

### 4. 集成真实会员状态

当前从 localStorage 读取：
```typescript
localStorage.getItem('membershipType')
```

**生产环境**：
- 从后端 API 获取会员状态
- 集成兑换码系统
- 实时验证权限

---

## 🧪 测试方法

### 测试不同会员类型

在浏览器控制台执行：

```javascript
// 测试季度会员（模糊回复）
localStorage.setItem('membershipType', '季度会员');
location.reload();

// 测试年度会员（清晰回复，无模式切换）
localStorage.setItem('membershipType', '年度会员');
location.reload();

// 测试永久会员（完整功能）
localStorage.setItem('membershipType', '永久会员');
location.reload();
```

### 测试模式切换

1. 设置为永久会员
2. 进入任意课程的 SALON 模块
3. 点击右上角刷新图标
4. 选择不同模式
5. 观察：
   - 背景变化
   - 开场白变化
   - AI 回复风格变化

---

## 🎯 商业化策略

### 转化漏斗

1. **季度会员体验**：
   - 可以输入消息（降低门槛）
   - 看到模糊回复（激发好奇）
   - 显示 "Upgrade to View" 提示
   - **转化目标**：升级到年度会员

2. **年度会员体验**：
   - 完整的 AI 对话功能
   - Better Way 纠错功能
   - 看到永久会员的模式切换按钮（灰色）
   - 显示 "Mode switching available for 永久会员"
   - **转化目标**：升级到永久会员

3. **永久会员体验**：
   - 所有功能无限制
   - 3 种模式自由切换
   - 无每日消息限制
   - **留存目标**：持续使用，口碑传播

---

## 📊 数据追踪建议

建议添加以下埋点：

```typescript
// 模式切换
analytics.track('salon_mode_switched', {
  from: oldMode,
  to: newMode,
  membershipType: membershipType
});

// 消息发送
analytics.track('salon_message_sent', {
  mode: currentMode,
  membershipType: membershipType,
  messageLength: input.length
});

// 升级提示点击
analytics.track('salon_upgrade_clicked', {
  from: membershipType,
  context: 'blurred_message' // 或 'mode_switch'
});
```

---

## 🚀 部署清单

- [ ] 确认 DEEPSEEK_API_KEY 环境变量已配置
- [ ] 添加聊天背景图片
- [ ] 添加 Gabby 头像
- [ ] 集成真实会员状态 API
- [ ] 测试三种模式的 AI 回复质量
- [ ] 测试会员权限控制
- [ ] 添加数据埋点
- [ ] 性能测试（API 响应时间）

---

## 💡 未来优化方向

1. **语音输入**：支持语音转文字
2. **语音回复**：AI 回复转语音播放
3. **对话保存**：保存历史对话记录
4. **分享功能**：分享精彩对话片段
5. **成就系统**：对话里程碑奖励
6. **AI 人格定制**：永久会员可自定义 AI 人格
7. **多语言支持**：支持其他语言学习

---

## 📞 技术支持

如有问题，请检查：
1. DeepSeek API Key 是否有效
2. 环境变量是否正确配置
3. 浏览器控制台是否有错误
4. 网络请求是否成功（Network 面板）

**常见问题**：
- **AI 不回复**：检查 API Key 和网络连接
- **模式切换无效**：确认会员类型为"永久会员"
- **背景图片不显示**：检查图片路径是否正确







