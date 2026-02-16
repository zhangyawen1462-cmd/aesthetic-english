# 🔧 可视化布局管理器字段更新问题修复

## 问题描述

在可视化布局管理器中点击"保存布局"后，Notion 中的以下字段没有被填充：

- ❌ `Content_Type` - 内容类型（video/image）
- ❌ `Cover_Img_16x9` - 归档封面（16:9）

只有以下字段被更新：
- ✅ `Display_Position` - 显示位置
- ✅ `Sort_Order` - 排序顺序
- ✅ `Cover_Ratio` - 封面比例

---

## 问题原因

**位置**: `app/api/layout/route.ts`

保存布局的 API 只更新了 3 个字段：

```typescript
// ❌ 修复前
notion.pages.update({
  page_id: pageId,
  properties: {
    Display_Position: { select: { name: 'dashboard-featured' } },
    Sort_Order: { number: i },
    Cover_Ratio: { select: { name: SLOT_RATIOS.dashboard[i] } }
    // 缺少 Content_Type 字段
  }
})
```

---

## 修复方案

### 1. 添加 `Content_Type` 字段更新

现在保存时会自动判断课程类型：

```typescript
// ✅ 修复后
// 获取课程信息
const page = await notion.pages.retrieve({ page_id: pageId });
const properties = (page as any).properties;

// 判断是否为纯图片卡片
const hasVideo = properties.Video_URL?.url;
const hasTitle = properties.Title_CN?.rich_text?.[0]?.plain_text || 
                 properties.Title_EN?.rich_text?.[0]?.plain_text;
const isImageCard = !hasVideo && !hasTitle;

// 更新时包含 Content_Type
notion.pages.update({
  page_id: pageId,
  properties: {
    Display_Position: { select: { name: 'dashboard-featured' } },
    Sort_Order: { number: i },
    Cover_Ratio: { select: { name: SLOT_RATIOS.dashboard[i] } },
    Content_Type: { select: { name: isImageCard ? 'image' : 'video' } } // ✅ 新增
  }
})
```

### 判断逻辑

**纯图片卡片**（`Content_Type = 'image'`）：
- 没有 `Video_URL`
- 没有 `Title_CN` 和 `Title_EN`

**视频课程**（`Content_Type = 'video'`）：
- 有 `Video_URL` 或有标题

---

## 关于 `Cover_Img_16x9` 字段

### 为什么没有自动填充？

`Cover_Img_16x9` 是**归档封面**，用于 Archives 页面的 16:9 显示。这个字段应该在**一键发布时**上传，而不是在布局管理器中自动生成。

### 正确的工作流程

1. **一键发布时**：
   - 上传精选封面 → `Cover_Img`
   - 上传归档封面 → `Cover_Img_16x9`（可选）

2. **布局管理器**：
   - 只负责设置显示位置和排序
   - 不负责上传或修改图片

### 如果需要添加归档封面

有两种方式：

#### 方式 1: 在 Notion 中手动添加
1. 打开 Notion 数据库
2. 找到对应课程
3. 在 `Cover_Img_16x9` 字段中粘贴 URL

#### 方式 2: 修改一键发布逻辑

在 `app/api/publish/route.ts` 中取消注释：

```typescript
// 当前是注释掉的
// if (coverArchiveUrl) {
//   notionProperties[NOTION_FIELDS.LESSON.COVER_IMG_16X9] = {
//     url: coverArchiveUrl
//   };
// }

// 取消注释后
if (coverArchiveUrl) {
  notionProperties[NOTION_FIELDS.LESSON.COVER_IMG_16X9] = {
    url: coverArchiveUrl
  };
}
```

然后在发布时上传归档封面。

---

## 更新后的字段列表

现在保存布局时会更新以下字段：

| 字段 | 类型 | 说明 | 示例值 |
|------|------|------|--------|
| `Display_Position` | Select | 显示位置 | `dashboard-featured` |
| `Sort_Order` | Number | 排序顺序 | `0`, `1`, `2`... |
| `Cover_Ratio` | Select | 封面比例 | `3/4`, `1/1`, `9/16`, `16/9` |
| `Content_Type` | Select | 内容类型 | `video` 或 `image` |

---

## 测试步骤

### 1. 测试纯图片卡片

1. 在 Notion 中创建一个课程：
   - `Lesson_ID` = `test-image-01`
   - `Cover_Img` = （图片 URL）
   - `Video_URL` = 空
   - `Title_CN` = 空
   - `Title_EN` = 空
   - `Status` = `Published`

2. 在布局管理器中拖拽到槽位

3. 点击保存

4. 检查 Notion：
   - ✅ `Content_Type` 应该是 `image`
   - ✅ `Display_Position` 应该是 `dashboard-featured`
   - ✅ `Sort_Order` 应该是对应的数字
   - ✅ `Cover_Ratio` 应该是对应的比例

---

### 2. 测试视频课程

1. 在 Notion 中创建一个课程：
   - `Lesson_ID` = `test-video-01`
   - `Cover_Img` = （图片 URL）
   - `Video_URL` = （视频 URL）
   - `Title_CN` = `测试视频`
   - `Title_EN` = `Test Video`
   - `Status` = `Published`

2. 在布局管理器中拖拽到槽位

3. 点击保存

4. 检查 Notion：
   - ✅ `Content_Type` 应该是 `video`
   - ✅ 其他字段同上

---

## 常见问题

### Q1: 为什么 `Cover_Img_16x9` 还是空的？

**A**: 这个字段需要在一键发布时上传归档封面，或者在 Notion 中手动添加。布局管理器不负责上传图片。

### Q2: 如何区分视频课程和图片卡片？

**A**: 
- **视频课程**：有 `Video_URL` 或有标题
- **图片卡片**：没有 `Video_URL` 且没有标题

### Q3: `Content_Type` 字段有什么用？

**A**: 用于前端判断如何渲染：
- `video` - 显示标题、期数、播放按钮
- `image` - 只显示图片，不显示标题

### Q4: 保存后需要刷新页面吗？

**A**: 建议刷新 Dashboard 页面，因为数据是从 Notion 实时获取的。

---

## 总结

✅ **已修复**: `Content_Type` 字段现在会自动填充  
ℹ️ **说明**: `Cover_Img_16x9` 需要在发布时上传，不是布局管理器的职责  
✅ **测试**: 请按照上述步骤测试纯图片卡片和视频课程  

---

**修复文件**: `app/api/layout/route.ts`  
**修复时间**: 2026年2月15日


