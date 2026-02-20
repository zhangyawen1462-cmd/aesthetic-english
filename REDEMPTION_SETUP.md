# 兑换码系统配置说明

## ✅ 已完成的工作

1. **生成了 70 个兑换码**
   - 20 个永久会员（AE-LIFE-xxx）
   - 20 个年度会员（AE-YEAR-xxx）
   - 30 个季度会员（AE-SEASON-xxx）

2. **创建了后端 API**
   - `/api/redeem` - 验证和激活兑换码

3. **创建了激活页面**
   - `/activate` - 用户输入兑换码的页面

4. **更新了 Notion 客户端**
   - 添加了 `verifyRedemptionCode()` 函数
   - 添加了 `activateRedemptionCode()` 函数

---

## 🔧 你需要完成的配置

### 1. 在 Notion 创建 Redemption Center 数据库

数据库需要包含以下字段：

| 字段名 | 类型 | 说明 |
|--------|------|------|
| Code | Title | 兑换码（主键）|
| Type | Select | 会员类型（永久会员/年度会员/季度会员）|
| Status | Select | 状态（🆕 待售/📤 已发货/✅ 已激活/❌ 已失效）|
| Created | Date | 生成日期 |
| Activated | Date | 激活日期 |
| User Email | Email | 用户邮箱 |
| Notes | Text | 备注 |

**Status 字段的选项：**
- 🆕 待售
- 📤 已发货
- ✅ 已激活
- ❌ 已失效

**Type 字段的选项：**
- 永久会员
- 年度会员
- 季度会员

### 2. 导入兑换码数据

打开 `redemption-codes.csv` 文件，复制所有内容，然后：
1. 在 Notion 中打开 Redemption Center 数据库
2. 点击右上角 "..." → "Merge with CSV"
3. 粘贴内容并导入

### 3. 配置 Notion Integration

1. 打开 Redemption Center 数据库
2. 点击右上角 "..." → "Add connections"
3. 选择你的 Notion Integration（和 Lessons 数据库用的同一个）

### 4. 添加数据库 ID 到环境变量

1. 在 Notion 中打开 Redemption Center 数据库
2. 复制浏览器地址栏中的数据库 ID（URL 中的那串字符）
3. 打开 `.env.local` 文件
4. 添加这一行：

```
NOTION_DB_REDEMPTION=你的数据库ID
```

---

## 🎯 使用流程

### 用户端流程：
1. 用户访问 `/activate` 页面
2. 输入兑换码和邮箱
3. 点击"激活会员"
4. 系统验证兑换码并激活
5. 跳转到 Dashboard 开始学习

### 你的运营流程：
1. 用户在小红书下单
2. 你在 Notion 中找一个 `🆕 待售` 的兑换码
3. 把状态改为 `📤 已发货`，备注写上用户信息
4. 把兑换码发给用户
5. 用户自己去网站激活
6. Notion 自动更新为 `✅ 已激活`，记录邮箱和激活时间

---

## 📝 下一步

完成上述配置后，告诉我数据库 ID，我帮你测试一下整个流程是否正常工作。

如果遇到任何问题，随时告诉我！









