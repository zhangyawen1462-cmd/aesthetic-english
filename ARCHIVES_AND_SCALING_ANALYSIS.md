# 📋 关于 Archives 和封面缩放的问题分析

**分析时间**: 2026年2月15日

---

## 问题 1: Archives 是否自动包含精选页面的视频？

### ✅ 答案：是的，会自动包含

### 📊 工作原理

**Archives API** (`app/api/archives/route.ts`):

```typescript
const filter: any = {
  and: [
    {
      property: 'Status',
      select: {
        equals: 'Published'  // 只要是 Published 状态
      }
    }
  ]
};

// 不筛选 Display_Position！
// 所以所有 Published 的课程都会显示在 Archives
```

**关键点**:
- ✅ Archives 显示**所有** `Status = 'Published'` 的课程
- ✅ **不管** `Display_Position` 是什么
- ✅ 包括 `dashboard-featured`、`daily-cinema`、`cognitive-featured`、`business-featured`、`archive-only`

### 📐 封面使用逻辑

**Archives 页面** (`app/archives/page.tsx`):

```typescript
// 图片区域 - 统一 16:9
<div className="relative aspect-video w-full overflow-hidden">
  <img 
    src={item.image}  // 使用什么封面？
    alt={item.title} 
    className="w-full h-full object-cover"
  />
</div>
```

**Archives API 返回的封面**:

```typescript
coverImg16x9: props.Cover_Img_16x9?.url || props.Cover_Img?.url || ''
// 优先使用 Cover_Img_16x9，如果没有则回退到 Cover_Img
```

---

## ❌ 问题：16:9 封面字段未启用

### 当前状态

**一键发布 API** (`app/api/publish/route.ts` 第 172-176 行):

```typescript
// 归档封面 - 暂时注释掉，等 Notion 添加 Cover_Img_16x9 字段后再启用
// if (coverArchiveUrl) {
//   notionProperties[NOTION_FIELDS.LESSON.COVER_IMG_16X9] = {
//     url: coverArchiveUrl
//   };
// }
```

**结果**:
- ❌ 即使用户上传了 16:9 归档封面，也**不会保存**到 Notion
- ❌ Archives 只能使用精选封面（可能不是 16:9）

---

## 🔧 解决方案

### 方案 1: 启用 Cover_Img_16x9 字段（推荐）

**步骤 1**: 确认 Notion 中有 `Cover_Img_16x9` 字段

在 Notion Lessons 数据库中检查是否有这个字段：
- 字段名：`Cover_Img_16x9`
- 类型：URL

**步骤 2**: 取消注释代码

修改 `app/api/publish/route.ts`:

```typescript
// ✅ 取消注释
if (coverArchiveUrl) {
  notionProperties[NOTION_FIELDS.LESSON.COVER_IMG_16X9] = {
    url: coverArchiveUrl
  };
}
```

**步骤 3**: 测试

1. 在一键发布台上传：
   - 精选封面（3:4 或其他比例）
   - 归档封面（16:9）
2. 发布后检查 Notion
3. 访问 Archives 页面，检查封面是否为 16:9

---

### 方案 2: 只使用一个封面（不推荐）

如果不想维护两个封面，可以：

1. 只上传 16:9 封面
2. 在所有页面都使用这个封面
3. 但这样精选页面的封面可能不合适（因为需要 3:4、1:1 等比例）

---

## 问题 2: 全站封面缩放问题

### 🔍 当前状态检查

让我检查所有使用封面的地方：

#### 1. Dashboard (`app/dashboard/page.tsx`)

```typescript
<img 
  src={item.img} 
  alt={item.title}
  className="... scale-[3.2] group-hover:scale-[3.26]"  // ❌ 有缩放
/>
```

**问题**: ✅ 有 `scale-[3.2]` 缩放

---

#### 2. Daily Cinema (`components/course/DailyCinemaView.tsx`)

```typescript
<img
  src={item.image}
  alt={item.titleEN}
  className="... scale-[1.3] group-hover:scale-[1.35]"  // ❌ 有缩放
/>
```

**问题**: ✅ 有 `scale-[1.3]` 缩放

---

#### 3. Archives (`app/archives/page.tsx`)

```typescript
<img 
  src={item.image} 
  alt={item.title} 
  className="w-full h-full object-cover grayscale-[0%] group-hover:scale-105"  // ❌ 有缩放
/>
```

**问题**: ✅ 有 `scale-105` (1.05倍) 缩放

---

#### 4. 布局管理器 (`app/admin/layout-manager/page.tsx`)

```typescript
<img
  src={lesson.coverImg}
  alt={lesson.titleEn || lesson.id}
  className="w-full h-full object-contain"  // ✅ 无缩放
/>
```

**问题**: ✅ 无缩放（正确）

---

### 🎯 缩放的设计意图

这些缩放**不是随意的**，而是有设计目的：

1. **Dashboard**: `scale-[3.2]` - 创造"放大镜"效果，聚焦图片细节
2. **Daily Cinema**: `scale-[1.3]` - 轻微放大，增加视觉冲击力
3. **Archives**: `scale-105` - hover 时轻微放大，提供交互反馈

### ⚠️ 问题

如果封面图片本身就是裁剪好的（刚好填满容器），缩放会导致：
- ❌ 图片边缘被裁切
- ❌ 重要内容可能被遮挡
- ❌ 构图被破坏

---

## 🔧 解决方案：移除所有缩放

### 修复 1: Dashboard

```typescript
// ❌ 修复前
className="... scale-[3.2] group-hover:scale-[3.26]"

// ✅ 修复后
className="... group-hover:scale-105"  // 只保留 hover 效果
```

### 修复 2: Daily Cinema

```typescript
// ❌ 修复前
className="... scale-[1.3] group-hover:scale-[1.35]"

// ✅ 修复后
className="... group-hover:scale-105"  // 只保留 hover 效果
```

### 修复 3: Archives

```typescript
// ✅ 已经是合理的缩放
className="... group-hover:scale-105"  // 保持不变
```

---

## 📊 总结

### 问题 1: Archives 封面

| 问题 | 当前状态 | 解决方案 |
|------|---------|---------|
| Archives 是否包含精选视频？ | ✅ 是的 | 无需修改 |
| 使用什么封面？ | ❌ 只用精选封面 | 启用 `Cover_Img_16x9` 字段 |
| 16:9 封面能上传吗？ | ❌ 代码被注释 | 取消注释 |

### 问题 2: 封面缩放

| 页面 | 当前缩放 | 问题 | 建议 |
|------|---------|------|------|
| Dashboard | `scale-[3.2]` | ❌ 过度放大 | 改为 `scale-100` 或 `scale-105` |
| Daily Cinema | `scale-[1.3]` | ❌ 轻微放大 | 改为 `scale-100` 或 `scale-105` |
| Archives | `scale-105` (hover) | ✅ 合理 | 保持不变 |
| 布局管理器 | 无缩放 | ✅ 正确 | 保持不变 |

---

## 🎯 推荐的修复顺序

### 立即修复

1. ✅ **启用 Cover_Img_16x9 字段**
   - 取消 `app/api/publish/route.ts` 第 172-176 行的注释
   - 确保 Notion 中有这个字段

2. ✅ **移除过度缩放**
   - Dashboard: `scale-[3.2]` → `scale-100`
   - Daily Cinema: `scale-[1.3]` → `scale-100`
   - 保留 hover 效果: `group-hover:scale-105`

### 测试步骤

1. 上传一个测试视频，包含两个封面：
   - 精选封面（3:4）
   - 归档封面（16:9）

2. 检查各页面：
   - Dashboard: 使用精选封面，无缩放
   - Daily Cinema: 使用精选封面，无缩放
   - Archives: 使用归档封面（16:9），无缩放

---

## 📝 需要修改的文件

1. `app/api/publish/route.ts` - 启用 Cover_Img_16x9
2. `app/dashboard/page.tsx` - 移除 scale-[3.2]
3. `components/course/DailyCinemaView.tsx` - 移除 scale-[1.3]

---

**需要我帮你执行这些修复吗？**


