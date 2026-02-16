# 🔍 Notion 字段匹配问题诊断报告

## 发现的问题

### 1. ❌ 字段名称不匹配

**Notion 实际字段** vs **代码中使用的字段**

| Notion 字段 | 代码中使用 | 状态 | 位置 |
|------------|-----------|------|------|
| `Lesson_ID` (Title) | `props.ID` | ❌ 错误 | `lib/notion-client.ts:95, 135` |
| `Cover_Img` (URL) | `props.Cover_URL` | ❌ 错误 | `lib/notion-client.ts:108, 162` |
| `EP` (Text) | `getNumber(props.EP)` | ❌ 错误类型 | `lib/notion-client.ts:103, 157` |
| `Title_CN` (Text) | `props.Title_CN` | ✅ 正确 | - |
| `Title_EN` (Text) | `props.Title_EN` | ✅ 正确 | - |
| `Video_URL` (URL) | `props.Video_URL` | ✅ 正确 | - |
| `Category` (Select) | `props.Category` | ✅ 正确 | - |
| `Status` (Select) | `props.Status` | ✅ 正确 | - |
| `Date` (Date) | `props.Date` | ✅ 正确 | - |
| `SRT_Raw` (Text) | `props.SRT_Raw` | ✅ 正确 | - |

### 2. ❌ 缺少关键字段

代码中**没有读取**以下 Notion 字段：

- `Display_Position` (Select) - 用于布局管理
- `Sort_Order` (Number) - 用于排序
- `Cover_Ratio` (Select) - 封面比例
- `Cover_Img_16x9` (URL) - 归档封面
- `Content_Type` (Select) - 内容类型

### 3. ❌ 缺少 `getDashboardLayout` 函数

`app/api/dashboard-layout/route.ts` 调用了 `getDashboardLayout()`，但该函数在 `lib/notion-client.ts` 中**不存在**！

### 4. ❌ EP 字段类型错误

- Notion 中 `EP` 是 **Text** 类型
- 代码中使用 `getNumber(props.EP)` 会返回 0
- 应该使用 `getPlainText(props.EP)`

---

## 修复方案

### 修复 1: 更正字段名称
### 修复 2: 添加缺失字段
### 修复 3: 创建 `getDashboardLayout` 函数
### 修复 4: 修正 EP 字段类型处理



