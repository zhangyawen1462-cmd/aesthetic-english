# 🔧 兑换系统故障排查指南

## ❌ 错误：500 服务器错误

### 可能的原因：

#### 1️⃣ **Notion 数据库字段不匹配**（最可能）

检查 **Memberships** 数据库的字段名称是否**完全一致**（包括大小写、空格）：

```
必需字段：
✅ User ID (Title) - 注意：是 "User ID"，不是 "UserID" 或 "user_id"
✅ Tier (Select) - 注意：是 "Tier"，不是 "Type" 或 "tier"
✅ Redemption Code (Text) - 注意：是 "Redemption Code"，有空格
✅ Activated At (Date) - 注意：是 "Activated At"，有空格
✅ Expires At (Date) - 注意：是 "Expires At"，有空格

可选字段：
✅ Email (Email)
```

#### 2️⃣ **Notion Integration 权限问题**

确认你的 Notion Integration 有访问 Memberships 数据库的权限：
1. 打开 Memberships 数据库
2. 点击右上角 `...` → Connections
3. 确认你的 Integration 已连接

#### 3️⃣ **环境变量未配置**

确认 Vercel 中的环境变量：
- `NOTION_DB_MEMBERSHIPS` = `1d598c4ecca4837c81d501b9f7de19da`
- `NOTION_API_KEY` = 你的 Notion API Key
- `JWT_SECRET` = 你的 JWT 密钥

---

## 🔍 如何查看详细错误信息：

### 方法 1：查看 Vercel 日志

1. 登录 Vercel
2. 进入项目 → Deployments → 最新部署
3. 点击 Functions 标签
4. 找到 `/api/redeem` 函数
5. 查看错误日志，会显示具体的错误信息

### 方法 2：查看浏览器 Network 面板

1. 打开浏览器开发者工具（F12）
2. 切换到 Network 标签
3. 重新提交兑换码
4. 点击 `redeem` 请求
5. 查看 Response 标签，可能有更详细的错误信息

---

## 🛠️ 临时调试方案：

如果你能访问 Vercel 日志，请查找以下关键信息：

```
❌ 记录兑换日志失败: [错误详情]
Redemption error: [错误详情]
```

这会告诉我们具体是哪一步出错了。

---

## 📋 快速检查清单：

- [ ] Memberships 数据库字段名称完全一致
- [ ] Notion Integration 已连接到 Memberships 数据库
- [ ] Vercel 环境变量 `NOTION_DB_MEMBERSHIPS` 已配置
- [ ] Redemption Codes 数据库中存在该兑换码
- [ ] 兑换码状态不是"已失效"

---

## 💡 最快的解决方法：

**截图发给我：**
1. Memberships 数据库的列标题（字段名称）
2. Vercel 日志中的错误详情

这样我可以立即定位问题！

