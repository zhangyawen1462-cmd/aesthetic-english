# 雷达系统排查指南

## 🔍 问题：雷达没有记录兑换

### 排查步骤：

#### 1. 检查 Vercel 环境变量
访问：Vercel → 你的项目 → Settings → Environment Variables

确认以下变量存在：
- ✅ `NOTION_DB_REDEMPTION_LOGS` = `f0298c4ecca4829a8b1c81cfefd2739e`

#### 2. 检查 Vercel 日志
访问：Vercel → 你的项目 → Deployments → 最新部署 → Functions

查找以下日志：
- `⚠️ NOTION_DB_REDEMPTION_LOGS 未配置` → 说明环境变量没配置
- `✅ 兑换日志已记录: LOG_xxx` → 说明记录成功
- `❌ 记录兑换日志失败:` → 说明记录失败，查看错误信息

#### 3. 检查 Notion 数据库字段
打开 Redemption Logs 数据库，确认字段名称**完全一致**（包括大小写和空格）：

必需字段：
- `Log ID` (Title)
- `Attempted Code` (Text)
- `Status` (Select: 🟢 成功, 🔴 失败)
- `Reason` (Text)
- `Device ID` (Text)
- `Email` (Email) - 可选
- `Time` (Date)
- `IP Address` (Text)

#### 4. 测试日志记录
在 Vercel 日志中搜索：
- 搜索 `logRedemptionAttempt` 
- 搜索你输入的兑换码
- 查看是否有错误信息

---

## 🛠️ 常见问题：

### 问题 1：环境变量未配置
**症状：** Vercel 日志显示 "⚠️ NOTION_DB_REDEMPTION_LOGS 未配置"
**解决：** 在 Vercel 添加环境变量后，重新部署

### 问题 2：字段名称不匹配
**症状：** Vercel 日志显示 Notion API 错误
**解决：** 检查 Notion 数据库字段名称，确保与代码一致

### 问题 3：Notion API 权限问题
**症状：** Vercel 日志显示 401 或 403 错误
**解决：** 确保 Notion Integration 有访问 Redemption Logs 数据库的权限

---

## 📊 如何查看 Vercel 日志：

1. 登录 Vercel
2. 进入你的项目
3. 点击 Deployments
4. 点击最新的部署
5. 点击 Functions 标签
6. 找到 `/api/redeem` 函数
7. 查看日志输出

---

## 🔄 临时解决方案：

如果急需查看兑换记录，可以：
1. 查看 Redemption Codes 数据库的 Status 字段
2. 查看 Memberships 数据库的记录
3. 等待修复后，历史记录会开始记录

---

需要帮助？提供 Vercel 日志截图，我可以帮你精确定位问题！

