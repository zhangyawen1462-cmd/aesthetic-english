# 📧 EmailJS 配置指南

## 1. 注册 EmailJS 账号

访问：https://www.emailjs.com/
- 点击 "Sign Up" 注册账号
- 使用 Google 账号或邮箱注册

---

## 2. 创建 Email Service

1. 登录后，点击左侧菜单 "Email Services"
2. 点击 "Add New Service"
3. 选择邮件服务商（推荐 Gmail 或 Outlook）
4. 连接您的邮箱账号
5. 复制 **Service ID**（类似：`service_xxxxxxx`）

---

## 3. 创建 Email Template

1. 点击左侧菜单 "Email Templates"
2. 点击 "Create New Template"
3. 设置模板内容：

**Subject（主题）：**
```
🔔 New Landing Page Visitor
```

**Content（内容）：**
```
Hello Scarlett,

You have received a new message from your Aesthetic English landing page.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

From: {{from_name}}
Email: {{from_email}}
Time: {{timestamp}}

Message:
{{message}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Reply to: {{from_email}}

Best regards,
Aesthetic English System
```

4. 点击 "Save"
5. 复制 **Template ID**（类似：`template_xxxxxxx`）

---

## 4. 获取 Public Key

1. 点击左侧菜单 "Account"
2. 找到 "API Keys" 部分
3. 复制 **Public Key**（类似：`xxxxxxxxxxxxxx`）

---

## 5. 配置环境变量

在项目根目录创建 `.env.local` 文件：

```bash
# EmailJS Configuration
NEXT_PUBLIC_EMAILJS_SERVICE_ID=service_xxxxxxx
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=template_xxxxxxx
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=xxxxxxxxxxxxxx
```

---

## 6. 更新代码

打开 `app/page.tsx`，找到第 135-137 行，替换为您的配置：

```javascript
const result = await emailjs.send(
  process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
  process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
  {
    from_name: 'Landing Page Visitor',
    to_email: 'aestheticenglish@outlook.com',
    message: 'Someone clicked the email link on the landing page',
    timestamp: new Date().toLocaleString('zh-CN'),
  },
  process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!
);
```

---

## 7. 测试

1. 重启开发服务器：`npm run dev`
2. 访问首页：http://localhost:3000
3. 点击底部的邮箱链接
4. 检查您的邮箱是否收到通知

---

## 📝 注意事项

1. **免费额度**：EmailJS 免费版每月 200 封邮件
2. **环境变量**：`.env.local` 文件不会被 Git 提交（已在 .gitignore 中）
3. **安全性**：Public Key 可以暴露在前端，Service ID 和 Template ID 也可以
4. **备用方案**：即使 EmailJS 发送失败，也会打开邮件客户端

---

## 🎯 工作流程

用户点击邮箱链接 → 打开 Plum Wine 风格弹窗 → 填写表单（姓名、邮箱、消息）→ 发送到您的邮箱

这样您可以：
- ✅ 收到访客的详细信息和消息
- ✅ 直接回复访客的邮箱
- ✅ 提供优雅的用户体验（无需打开邮件客户端）
- ✅ 所有消息都保存在您的邮箱中
