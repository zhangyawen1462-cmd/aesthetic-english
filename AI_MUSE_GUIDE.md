# The Muse - AI 语境陪练系统

## 🎯 功能概述

The Muse 是一个基于视频语境的 AI 对话陪练系统，让用户在观看课程视频后，能够与 AI 进行角色扮演式的英语对话练习。

---

## ✨ 核心特点

### 1. 沉浸式角色扮演
- AI 会根据视频内容扮演相应角色
- 鼓励用户使用视频中学到的词汇和表达
- 自然纠错：不生硬指出错误，而是在回复中示范正确用法

### 2. Instagram 风格界面
- 简洁优雅的对话气泡
- 流畅的动画效果
- 墨水晕染式的思考动效

### 3. 会员分层权限
- **季度会员**：🔒 无法使用（显示升级提示）
- **年度会员**：✅ 可以使用
- **永久会员**：✅ 可以使用

---

## 🔧 技术实现

### 已创建的文件

1. **`app/api/ai-chat/route.ts`**
   - 处理 AI 对话请求
   - 调用 DeepSeek API
   - 构建系统提示词

2. **`components/AIMuse.tsx`**
   - Instagram 风格的对话界面
   - 会员权限检查
   - 实时对话交互

3. **`components/ModuleSalon.tsx`**
   - Salon 模块入口
   - 打开 AI 对话界面
   - 主题适配

4. **`app/activate/page.tsx`**（已更新）
   - 激活成功后保存会员类型到 localStorage

---

## 📝 使用流程

### 用户端
1. 用户观看课程视频
2. 切换到 "SALON" 模块
3. 点击 "Enter The Salon" 按钮
4. 与 AI 进行对话练习

### 权限控制
- 系统自动从 localStorage 读取会员类型
- 季度会员会看到锁定界面和升级提示
- 年度/永久会员可以直接使用

---

## 🎨 设计细节

### 对话界面
- **用户消息**：紫粉渐变气泡，右对齐
- **AI 消息**：灰色气泡，左对齐
- **思考动效**：三个圆点的呼吸动画
- **输入框**：圆角灰色背景，渐变发送按钮

### 锁定状态
- 半透明白色遮罩
- 锁图标 + 提示文字
- 渐变升级按钮

---

## 🚀 下一步优化（可选）

### 1. 对话次数限制（年度会员）
在 `app/api/ai-chat/route.ts` 中添加：
```typescript
// 检查对话次数（年度会员每月 20 次）
if (membershipType === '年度会员') {
  const usageKey = `ai_usage_${email}_${new Date().getMonth()}`;
  const usage = parseInt(localStorage.getItem(usageKey) || '0');
  
  if (usage >= 20) {
    return NextResponse.json(
      { error: 'quota_exceeded', message: '本月对话次数已用完，升级永久会员解锁无限畅聊' },
      { status: 403 }
    );
  }
  
  localStorage.setItem(usageKey, String(usage + 1));
}
```

### 2. 角色模式切换（永久会员专属）
添加 "温柔模式" 和 "地狱难度模式" 切换按钮

### 3. 对话历史保存
将对话保存到 Notion 数据库（需要创建新的 Chat History 数据库）

### 4. 语音输入
集成 Web Speech API，支持语音输入

---

## 🧪 测试步骤

1. **激活会员**
   - 访问 `/activate`
   - 输入兑换码和邮箱
   - 激活成功后会自动保存会员类型

2. **测试 AI 对话**
   - 进入任意课程页面
   - 切换到 SALON 模块
   - 点击 "Enter The Salon"
   - 开始对话

3. **测试权限控制**
   - 清除 localStorage：`localStorage.clear()`
   - 刷新页面，应该看到锁定界面

---

## 💰 成本估算

使用 DeepSeek API：
- 价格：约 ¥0.001 / 1K tokens
- 单次对话：约 200-500 tokens
- 成本：约 ¥0.0002-0.0005 / 次对话

**示例：**
- 100 个年度会员，每人每月 20 次对话
- 总对话次数：2000 次/月
- 月成本：约 ¥0.4-1 元

非常便宜！

---

## 🔐 环境变量

确保 Vercel 中已配置：
```
DEEPSEEK_API_KEY=你的DeepSeek API密钥
```

---

## ✅ 完成状态

- ✅ API 路由创建
- ✅ 对话界面组件
- ✅ Salon 模块更新
- ✅ 会员权限控制
- ✅ 激活页面更新
- ✅ 课程页面集成

**系统已就绪，可以开始测试！**









