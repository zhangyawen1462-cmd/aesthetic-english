# 🗄️ Notion 数据库设计方案

## 📊 数据库架构

### Database 1: 兑换码金库 (Redemption Codes)

**用途**: 管理所有兑换码的生成、分发和激活状态

#### 字段设计

| 字段名 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| Code | Title | 兑换码（唯一标识） | `WINE-2024-001` |
| Type | Select | 会员类型 | `季度会员` / `年度会员` / `永久会员` |
| Status | Select | 状态 | `🆕 待售` / `📤 已发货` / `✅ 已激活` / `❌ 已失效` |
| Created | Date | 创建日期 | 2024-01-15 |
| Activated | Date | 激活日期 | 2024-01-20 |
| User Email | Email | 激活用户邮箱 | user@example.com |
| Device ID | Text | 设备标识（可选） | `device_abc123` |
| Notes | Text | 备注 | 小红书订单 #123 |
| Batch | Select | 批次 | `2024-Q1` / `春节活动` |

#### Select 选项配置

**Type 字段**:
- 季度会员
- 年度会员
- 永久会员

**Status 字段**:
- 🆕 待售
- 📤 已发货
- ✅ 已激活
- ❌ 已失效

---

### Database 2: 用户通行证 (User Memberships)

**用途**: 记录已激活用户的会员信息和权限

#### 字段设计

| 字段名 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| User ID | Title | 用户唯一标识 | `user_abc123` |
| Email | Email | 用户邮箱 | user@example.com |
| Tier | Select | 当前会员等级 | `季度会员` / `年度会员` / `永久会员` |
| Activated At | Date | 激活时间 | 2024-01-20 |
| Expires At | Date | 过期时间 | 2024-04-20 (永久会员为空) |
| Redemption Code | Relation | 关联的兑换码 | → Redemption Codes |
| Device ID | Text | 设备标识 | `device_abc123` |
| Last Active | Date | 最后活跃时间 | 2024-02-15 |
| Status | Select | 账户状态 | `✅ 活跃` / `⏸️ 暂停` / `❌ 已过期` |

#### Select 选项配置

**Tier 字段**:
- 季度会员
- 年度会员
- 永久会员

**Status 字段**:
- ✅ 活跃
- ⏸️ 暂停
- ❌ 已过期

---

### Database 3: AI 对话使用记录 (Chat Usage) - 可选

**用途**: 追踪年度会员的对话次数（如果需要持久化到 Notion）

#### 字段设计

| 字段名 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| Record ID | Title | 记录标识 | `user_abc123_daily-001` |
| User ID | Text | 用户标识 | `user_abc123` |
| Lesson ID | Text | 课程 ID | `daily-001` |
| Chat Count | Number | 对话次数 | 12 |
| Last Chat At | Date | 最后对话时间 | 2024-02-15 14:30 |
| Tier | Select | 会员等级 | `年度会员` |

**注意**: 考虑到 Notion API 的频率限制，建议对话次数使用 **Vercel KV** 或 **加密 Cookie** 存储，只在必要时同步到 Notion。

---

## 🔧 Notion API 配置

### 1. 创建 Integration

1. 访问 https://www.notion.so/my-integrations
2. 点击 "New integration"
3. 命名: `Aesthetic English Backend`
4. 选择关联的 Workspace
5. 复制 **Internal Integration Token**

### 2. 共享数据库

在 Notion 中，将以上三个数据库分享给你的 Integration：
1. 打开数据库页面
2. 点击右上角 "Share"
3. 搜索你的 Integration 名称
4. 点击 "Invite"

### 3. 获取 Database ID

打开数据库页面，URL 格式为：
```
https://www.notion.so/{workspace}/{database_id}?v={view_id}
```

复制 `database_id` 部分（32位字符）

### 4. 环境变量配置

在 `.env.local` 中添加：

```bash
# Notion API
NOTION_API_KEY=secret_xxxxxxxxxxxxxxxxxxxxx
NOTION_DB_REDEMPTION=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_DB_MEMBERSHIPS=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_DB_CHAT_USAGE=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# JWT Secret (用于加密 Cookie)
JWT_SECRET=your-super-secret-key-change-this-in-production
```

---

## 📝 数据流程图

### 兑换码激活流程

```
用户输入兑换码
    ↓
前端发送到 /api/redeem
    ↓
后端查询 Notion【兑换码金库】
    ↓
验证码是否有效且未使用
    ↓
更新 Notion：Status → ✅ 已激活
    ↓
创建/更新【用户通行证】记录
    ↓
生成加密 JWT Token
    ↓
存入 HttpOnly Cookie
    ↓
返回成功，前端刷新权限
```

### AI 对话验证流程

```
用户发送消息
    ↓
前端调用 /api/ai-chat
    ↓
后端读取 Cookie 中的 JWT
    ↓
解密获取 User ID 和 Tier
    ↓
查询 Vercel KV 获取对话次数
    ↓
验证是否超过限制
    ↓
[未超限] 调用 AI → 增加计数 → 返回回复
[已超限] 返回 paywall_limit_reached
    ↓
前端显示深酒红帷幕
```

---

## 🎨 Notion 界面美化建议

### 兑换码金库视图

**Gallery View** (卡片视图):
- 按 Status 分组
- 卡片显示: Code, Type, Created
- 颜色标签: 
  - 🆕 待售 → 蓝色
  - 📤 已发货 → 黄色
  - ✅ 已激活 → 绿色
  - ❌ 已失效 → 红色

**Table View** (表格视图):
- 按 Created 降序排列
- 筛选器: Status = 已激活
- 用于查看激活历史

### 用户通行证视图

**Board View** (看板视图):
- 按 Tier 分组
- 三列: 季度会员 / 年度会员 / 永久会员
- 快速查看用户分布

**Timeline View** (时间线视图):
- 按 Expires At 排序
- 查看即将过期的会员

---

## 🔒 安全考虑

### 1. 兑换码生成规则

```javascript
// 格式: {PREFIX}-{YEAR}-{RANDOM}
// 示例: WINE-2024-A7K9X2

function generateRedemptionCode(tier) {
  const prefix = 'WINE';
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${year}-${random}`;
}
```

### 2. 防止暴力破解

- 限制每个 IP 每小时最多尝试 5 次兑换
- 使用 Vercel Edge Config 存储黑名单
- 记录所有失败尝试到 Notion

### 3. Cookie 安全配置

```javascript
{
  httpOnly: true,      // 防止 JS 读取
  secure: true,        // 仅 HTTPS
  sameSite: 'strict',  // 防止 CSRF
  maxAge: 90 * 24 * 60 * 60 * 1000  // 90天
}
```

---

## 📊 数据统计示例

在 Notion 中可以创建 Dashboard 页面，使用 Rollup 和 Formula 字段统计：

- 总兑换码数量
- 已激活数量
- 激活率
- 各等级会员分布
- 本月新增用户
- 即将过期会员数

---

## 🚀 下一步

1. 在 Notion 中创建以上三个数据库
2. 配置 Integration 并获取 API Key
3. 将 Database ID 添加到环境变量
4. 开始实现后端 API 代码

准备好后，我将为你生成完整的 Next.js API 代码。






