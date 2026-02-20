# 🚀 Notion 付费墙实施指南

## 📦 第一步：安装依赖包

```bash
npm install @notionhq/client jose @vercel/kv
```

**包说明**：
- `@notionhq/client`: Notion API 客户端
- `jose`: JWT 加密/解密（Next.js 推荐，比 jsonwebtoken 更轻量）
- `@vercel/kv`: Vercel KV 存储（用于对话计数）

---

## 🔑 第二步：配置环境变量

在 `.env.local` 中添加：

```bash
# Notion API
NOTION_API_KEY=secret_xxxxxxxxxxxxxxxxxxxxx
NOTION_DB_REDEMPTION=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# JWT 密钥（生产环境请使用强密码）
JWT_SECRET=your-super-secret-key-min-32-chars-change-in-production

# Vercel KV（如果使用 Vercel 部署会自动注入）
KV_URL=redis://...
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...
KV_REST_API_READ_ONLY_TOKEN=...

# OpenAI API（如果使用）
OPENAI_API_KEY=sk-...
```

### 获取 Notion 配置

1. **NOTION_API_KEY**:
   - 访问 https://www.notion.so/my-integrations
   - 创建 Integration，复制 Token

2. **NOTION_DB_REDEMPTION**:
   - 打开你的兑换码数据库
   - URL 格式: `https://www.notion.so/{workspace}/{database_id}?v=...`
   - 复制 `database_id` 部分（32位字符）
   - 记得在数据库页面点击 "Share" → 邀请你的 Integration

---

## 📁 第三步：创建文件结构

```
app/
├── api/
│   ├── redeem/
│   │   └── route.ts          # 兑换码验证
│   ├── ai-chat-secure/
│   │   └── route.ts          # AI 对话（带权限验证）
│   ├── membership/
│   │   └── route.ts          # 获取会员状态
│   └── chat-usage/
│       └── [lessonId]/
│           └── route.ts      # 获取对话次数
lib/
└── notion-redemption.ts      # Notion 辅助函数
components/
└── WineCurtain.tsx           # 深酒红帷幕组件
```

---

## 💾 第四步：创建 Notion 辅助函数

文件：`lib/notion-redemption.ts`

```typescript
import { Client } from '@notionhq/client';

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const REDEMPTION_DB = process.env.NOTION_DB_REDEMPTION || '';

// 辅助函数：解析 Notion 属性
export function getPlainText(property: any): string {
  if (!property) return '';
  if (property.type === 'title' && property.title?.[0]) {
    return property.title[0].plain_text;
  }
  if (property.type === 'rich_text' && property.rich_text?.[0]) {
    return property.rich_text[0].plain_text;
  }
  return '';
}

export function getSelect(property: any): string {
  return property?.select?.name || '';
}

export function getEmail(property: any): string {
  return property?.email || '';
}

// 查询兑换码
export async function queryRedemptionCode(code: string) {
  const response = await notion.databases.query({
    database_id: REDEMPTION_DB,
    filter: {
      property: 'Code',
      title: {
        equals: code.trim().toUpperCase()
      }
    }
  });

  return response.results[0] || null;
}

// 激活兑换码
export async function activateRedemptionCode(
  pageId: string,
  userEmail: string
) {
  await notion.pages.update({
    page_id: pageId,
    properties: {
      Status: {
        select: {
          name: '✅ 已激活'
        }
      },
      'User Email': {
        email: userEmail
      },
      ActivatedDate: {
        date: {
          start: new Date().toISOString().split('T')[0]
        }
      }
    }
  });
}

// 转换会员类型
export function convertTierToEnglish(chineseTier: string): string {
  const mapping: Record<string, string> = {
    '季度会员': 'quarterly',
    '年度会员': 'yearly',
    '永久会员': 'lifetime'
  };
  return mapping[chineseTier] || 'quarterly';
}
```

---

## 🎯 第五步：实现兑换码验证 API

文件：`app/api/redeem/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';
import {
  queryRedemptionCode,
  activateRedemptionCode,
  getPlainText,
  getSelect,
  convertTierToEnglish
} from '@/lib/notion-redemption';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

export async function POST(req: NextRequest) {
  try {
    const { code, email } = await req.json();

    // 1. 验证输入
    if (!code || !code.trim()) {
      return NextResponse.json(
        { success: false, error: 'invalid_code', message: '请输入兑换码' },
        { status: 400 }
      );
    }

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'invalid_email', message: '请输入有效的邮箱' },
        { status: 400 }
      );
    }

    // 2. 查询 Notion
    const page = await queryRedemptionCode(code);

    if (!page) {
      return NextResponse.json(
        { success: false, error: 'code_not_found', message: '兑换码不存在' },
        { status: 404 }
      );
    }

    if (!('properties' in page)) {
      return NextResponse.json(
        { success: false, error: 'invalid_data', message: '数据格式错误' },
        { status: 500 }
      );
    }

    const props = page.properties;
    const status = getSelect(props.Status);
    const type = getSelect(props.Type);

    // 3. 验证状态
    if (status === '✅ 已激活') {
      return NextResponse.json(
        { success: false, error: 'code_used', message: '该兑换码已被使用' },
        { status: 400 }
      );
    }

    if (status !== '🆕 待售') {
      return NextResponse.json(
        { success: false, error: 'invalid_status', message: '兑换码状态异常' },
        { status: 400 }
      );
    }

    // 4. 激活兑换码
    await activateRedemptionCode(page.id, email);

    // 5. 生成 JWT Token
    const tier = convertTierToEnglish(type);
    const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const token = await new SignJWT({
      userId,
      tier,
      email,
      activatedAt: Date.now()
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(tier === 'lifetime' ? '10y' : tier === 'yearly' ? '1y' : '90d')
      .sign(JWT_SECRET);

    // 6. 设置 HttpOnly Cookie
    cookies().set('ae_membership', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: tier === 'lifetime' 
        ? 10 * 365 * 24 * 60 * 60 
        : tier === 'yearly'
          ? 365 * 24 * 60 * 60
          : 90 * 24 * 60 * 60,
      path: '/'
    });

    // 7. 返回成功
    return NextResponse.json({
      success: true,
      message: '兑换成功！',
      data: {
        tier,
        tierLabel: type
      }
    });

  } catch (error) {
    console.error('Redemption error:', error);
    return NextResponse.json(
      { success: false, error: 'server_error', message: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
```

---

## 下一步

由于内容较长，我将分成多个文件。请告诉我是否需要继续创建：

1. ✅ AI 对话验证 API（带计数限制）
2. ✅ 获取会员状态 API
3. ✅ 获取对话次数 API
4. ✅ 深酒红帷幕组件（WineCurtain.tsx）
5. ✅ 更新 ModuleSalon.tsx 集成新逻辑

我已经创建了这些文件，它们在：
- `app/api/ai-chat-secure/route.ts`
- `app/api/membership/route.ts`
- `app/api/chat-usage/[lessonId]/route.ts`

现在需要创建前端组件和更新现有代码吗？






