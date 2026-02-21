# Vercel 环境变量配置清单

## 📋 需要在 Vercel 中添加的环境变量

请在 Vercel 项目的 Settings → Environment Variables 中添加以下变量：

---

### ✅ 已有的环境变量（请确认）

```bash
NOTION_API_KEY=你的Notion_API_Key
NOTION_DB_LESSONS=你的Lessons数据库ID
NOTION_DB_VOCABULARY=你的Vocabulary数据库ID
NOTION_DB_GRAMMAR=你的Grammar数据库ID
NOTION_DB_RECALL=你的Recall数据库ID
NOTION_DB_REDEMPTION=你的Redemption数据库ID

OSS_REGION=oss-cn-hongkong
OSS_ACCESS_KEY_ID=你的阿里云AccessKeyID
OSS_ACCESS_KEY_SECRET=你的阿里云AccessKeySecret
OSS_BUCKET=aesthetic-assets
OSS_CDN_DOMAIN=https://assets.aestheticenglish.com

DEEPSEEK_API_KEY=你的DeepSeek_API_Key
```

---

### 🆕 需要新增的环境变量

```bash
# Memberships 数据库 ID
NOTION_DB_MEMBERSHIPS=1d598c4ecca4837c81d501b9f7de19da

# Redemption Logs 数据库 ID（主理人雷达）
NOTION_DB_REDEMPTION_LOGS=f0298c4ecca4829a8b1c81cfefd2739e

# 管理员密钥（用于访问雷达页面）
ADMIN_SECRET=admin2026

# JWT 密钥（用于生成会员 Token）
JWT_SECRET=your-jwt-secret-key-change-in-production-2024
```

---

## 🚀 添加步骤

1. 登录 Vercel：https://vercel.com
2. 进入你的项目
3. 点击 Settings → Environment Variables
4. 逐个添加上面的 4 个新环境变量
5. 选择应用到所有环境（Production, Preview, Development）
6. 保存后，Vercel 会自动触发重新部署

---

## ✅ 验证配置

部署完成后，测试以下功能：

### 1. 测试兑换功能
- 访问网站，输入兑换码
- 应该能成功兑换并登录

### 2. 测试雷达系统
- 访问：`https://你的域名/admin`
- 点击"📡 主理人雷达"
- 应该能看到刚才的兑换记录

### 3. 测试会员状态
- 关闭浏览器，重新打开网站
- 应该自动登录，不需要再次输入兑换码

---

## 🔒 安全提示

- ✅ 所有敏感信息都通过环境变量配置
- ✅ JWT_SECRET 用于加密用户 Token
- ✅ ADMIN_SECRET 保护管理员页面
- ⚠️ 不要将这些密钥提交到 Git 仓库

---

## 📊 数据库关系

```
Redemption Codes (兑换码数据库)
    ↓ 验证
Redemption Logs (日志数据库) ← 记录所有尝试
    ↓ 成功后创建
Memberships (会员通行证数据库)
```

---

配置完成后，整个系统就能正常运行了！🎉

