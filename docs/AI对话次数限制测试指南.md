# 📋 AI 对话次数限制测试指南

## ✅ 已实现的功能

### 对话次数限制机制
- **季度会员**: 无法使用 AI 对话（显示模糊预览）
- **年度会员**: 每期视频限制 15 次对话
- **永久会员**: 无限对话

### 技术实现
- 使用 `localStorage` 存储每期视频的对话次数
- 存储键格式: `gabby_chat_count_${lessonId}`
- 每次发送消息后自动增加计数
- 达到限制后禁用输入框和发送按钮

---

## 🧪 测试步骤

### 准备工作

1. **启动开发服务器**
```bash
npm run dev
```

2. **打开浏览器开发者工具**
   - 按 `F12` 或右键 → 检查
   - 打开 Console 面板

3. **进入任意课程详情页**
   - 例如: `http://localhost:3000/course/daily/daily-001`
   - 点击底部导航栏的 **SALON** 图标（💬）

---

## 测试场景 1: 季度会员（无法使用）

### 1.1 设置为季度会员

在浏览器 Console 中执行：
```javascript
localStorage.setItem('dev_tier_override', 'quarterly');
location.reload();
```

### 1.2 验证预期行为

**预期结果**：
- ✅ 可以看到 Gabby 的开场白
- ✅ 输入框 placeholder 显示: "Reply to unlock..."
- ✅ 输入消息后，AI 回复显示模糊效果（带锁图标）
- ✅ 底部提示: "Preview Mode • Upgrade to Yearly for full access"

---

## 测试场景 2: 年度会员（15 次限制）

### 2.1 设置为年度会员

在浏览器 Console 中执行：
```javascript
localStorage.setItem('dev_tier_override', 'yearly');
location.reload();
```

### 2.2 清空对话次数（重新开始测试）

在浏览器 Console 中执行：
```javascript
// 查看当前课程 ID
const lessonId = window.location.pathname.split('/').pop();
console.log('当前课程 ID:', lessonId);

// 清空该课程的对话次数
localStorage.removeItem(`gabby_chat_count_${lessonId}`);
location.reload();
```

### 2.3 测试对话次数追踪

1. **发送第 1 条消息**
   - 输入任意内容，例如: "Hello"
   - 点击发送按钮
   - **预期**: 底部显示 "剩余 14/15 次对话"

2. **继续发送消息**
   - 每发送一条消息，剩余次数减 1
   - 底部提示实时更新: "剩余 13/15 次对话" → "剩余 12/15 次对话" ...

3. **发送第 15 条消息**
   - **预期**: 底部显示 "剩余 0/15 次对话"
   - 输入框被禁用
   - Placeholder 变为: "已达到本期对话次数上限..."
   - 发送按钮变灰且无法点击

4. **尝试发送第 16 条消息**
   - 输入框已禁用，无法输入
   - 如果强制点击发送按钮，会弹出提示:
     ```
     本期视频的对话次数已用完（15 次）。升级到永久会员可无限对话！
     ```

### 2.4 验证跨页面持久化

1. **刷新页面**
   ```javascript
   location.reload();
   ```
   - **预期**: 对话次数保持不变（仍然是 0/15）
   - 输入框仍然被禁用

2. **切换到其他课程**
   - 访问另一个课程，例如: `/course/daily/daily-002`
   - **预期**: 新课程的对话次数重新开始（15/15）
   - 可以正常对话

3. **返回原课程**
   - 返回 `/course/daily/daily-001`
   - **预期**: 对话次数仍然是 0/15（已用完）

---

## 测试场景 3: 永久会员（无限对话）

### 3.1 设置为永久会员

在浏览器 Console 中执行：
```javascript
localStorage.setItem('dev_tier_override', 'lifetime');
location.reload();
```

### 3.2 验证无限对话

**预期结果**：
- ✅ 底部提示: "∞ 无限对话"
- ✅ 可以发送任意多条消息
- ✅ 没有次数限制
- ✅ 输入框始终可用
- ✅ 可以切换 AI 人格模式（The Partner / The Critic / The Flâneur）

---

## 🎨 UI 检查清单

### 底部提示文案

#### 季度会员
- [ ] "Preview Mode • Upgrade to Yearly for full access"

#### 年度会员（有剩余次数）
- [ ] "剩余 15/15 次对话"
- [ ] "剩余 10/15 次对话"
- [ ] "剩余 1/15 次对话"

#### 年度会员（已用完）
- [ ] "已用完本期 15 次对话 • 升级到永久会员可无限对话"

#### 永久会员
- [ ] "∞ 无限对话"

### 输入框状态

#### 正常状态
- [ ] Placeholder: "Reply to Gabby..."
- [ ] 可以输入文字
- [ ] 发送按钮为主题色

#### 达到限制
- [ ] Placeholder: "已达到本期对话次数上限..."
- [ ] 输入框禁用（灰色）
- [ ] 发送按钮禁用（灰色）

---

## 🐛 常见问题排查

### 问题 1: 对话次数没有增加

**检查步骤**：
1. 打开浏览器 Console，输入：
```javascript
const lessonId = window.location.pathname.split('/').pop();
console.log('存储键:', `gabby_chat_count_${lessonId}`);
console.log('当前次数:', localStorage.getItem(`gabby_chat_count_${lessonId}`));
```

2. 确认 `lessonId` 是否正确
3. 检查 `localStorage` 中是否有对应的键

---

### 问题 2: 刷新后次数重置

**可能原因**：
- `lessonId` 获取错误
- `localStorage` 被清空

**检查步骤**：
1. 确认 URL 格式正确: `/course/{category}/{lessonId}`
2. 检查浏览器是否开启了隐私模式（会清空 localStorage）

---

### 问题 3: 永久会员也有次数限制

**可能原因**：
- `dev_tier_override` 设置错误
- `PERMISSIONS.gabby.getConfig()` 返回错误

**检查步骤**：
1. 在 Console 中确认会员等级：
```javascript
console.log('会员等级:', localStorage.getItem('dev_tier_override'));
```

2. 检查权限配置：
```javascript
// 在 ModuleSalon.tsx 中添加调试日志
console.log('Gabby Config:', gabbyConfig);
console.log('Daily Limit:', dailyLimit);
```

---

## 📊 测试结果记录表

| 测试场景 | 会员等级 | 对话次数限制 | 底部提示 | 输入框状态 | 结果 |
|---------|---------|------------|---------|-----------|------|
| 场景 1 | 季度会员 | 无法使用 | Preview Mode | 可输入但回复模糊 | ⬜ 通过 / ⬜ 失败 |
| 场景 2.1 | 年度会员 | 15 次 | 剩余 X/15 | 正常 | ⬜ 通过 / ⬜ 失败 |
| 场景 2.2 | 年度会员 | 已用完 | 已用完提示 | 禁用 | ⬜ 通过 / ⬜ 失败 |
| 场景 2.3 | 年度会员 | 跨页面持久化 | 保持状态 | 保持状态 | ⬜ 通过 / ⬜ 失败 |
| 场景 3 | 永久会员 | 无限 | ∞ 无限对话 | 始终可用 | ⬜ 通过 / ⬜ 失败 |

---

## 🔧 调试命令

### 查看当前对话次数
```javascript
const lessonId = window.location.pathname.split('/').pop();
console.log('对话次数:', localStorage.getItem(`gabby_chat_count_${lessonId}`));
```

### 手动设置对话次数
```javascript
const lessonId = window.location.pathname.split('/').pop();
localStorage.setItem(`gabby_chat_count_${lessonId}`, '14'); // 设置为 14 次
location.reload();
```

### 清空所有对话次数
```javascript
Object.keys(localStorage).forEach(key => {
  if (key.startsWith('gabby_chat_count_')) {
    localStorage.removeItem(key);
  }
});
console.log('已清空所有对话次数');
location.reload();
```

### 查看所有课程的对话次数
```javascript
Object.keys(localStorage).forEach(key => {
  if (key.startsWith('gabby_chat_count_')) {
    console.log(key, ':', localStorage.getItem(key));
  }
});
```

---

## 🎯 下一步

测试通过后，可以继续实施：
1. **下载功能权限控制**（导出笔记、下载视频）
2. **Notion 兑换码系统**
3. **后端会员数据集成**（Supabase）

---

## 📝 备注

- 测试环境：开发模式 (`npm run dev`)
- 使用 `localStorage` 模拟会员等级和对话次数
- 生产环境将从 Supabase 获取真实会员数据
- 对话次数存储在客户端，未来可迁移到服务器端






