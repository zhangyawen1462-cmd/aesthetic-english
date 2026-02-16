# 🔄 CDN 集成后工作流完整检查

## 检查时间
2026-02-16

---

## ✅ 工作流状态：完全正常

### 总体评估
- ✅ 上传流程正常
- ✅ CDN 自动转换正常
- ✅ 前端显示正常
- ✅ 布局管理器正常
- ⚠️ 注意：API 有 5 分钟缓存

---

## 📋 完整工作流程

### 1️⃣ 上传阶段 ✅

#### 入口
```
/admin/publish
```

#### 流程
1. **选择文件**
   - 视频：MP4（建议纯英文文件名）
   - 封面：JPG/PNG
   - 字幕：SRT

2. **填写信息**
   - Lesson ID（如 `daily-01`）
   - 标题（中英文）
   - 分类（Daily/Cognitive/Business）
   - 期数（如 `01`）

3. **上传到 OSS**
   ```typescript
   // lib/oss-client.ts
   export async function uploadToOSS(file: File, folder: string) {
     // 上传到阿里云 OSS
     // 返回原始 OSS URL
   }
   ```

4. **自动 CDN 转换** ✅
   ```typescript
   // app/api/publish/route.ts
   if (coverFeaturedUrl) {
     notionProperties[NOTION_FIELDS.LESSON.COVER_IMG] = {
       url: coverFeaturedUrl  // ← 这里存的是原始 OSS URL
     };
   }
   ```

5. **AI 生成内容**
   - 词汇（5-8个）
   - 语法（3-5个）
   - 回译（完整文本）

6. **写入 Notion**
   - 课程信息
   - Status: `Draft`（待审核）
   - Display_Position: `available-pool`（待排版）

**结果**：✅ 文件上传到 OSS，URL 存入 Notion

---

### 2️⃣ 审核阶段 ✅

#### 在 Notion 中操作

1. **检查内容**
   - 视频 URL 是否正确
   - 封面 URL 是否正确
   - AI 生成的词汇/语法是否准确

2. **修改 Status**
   ```
   Draft → Published
   ```

3. **设置显示位置**（可选）
   - `dashboard-featured`：首页精选（8个位置）
   - `daily-cinema`：Daily Cinema 页面
   - `cognitive-featured`：Cognitive Growth 页面
   - `business-featured`：Business Female 页面
   - `available-pool`：可用池（不显示，但可在布局管理器中使用）

4. **设置排序**
   - Sort_Order: 0-7（对应 8 个位置）

**结果**：✅ 课程状态变为 Published，可以被前端读取

---

### 3️⃣ 前端显示阶段 ✅

#### CDN 自动转换

**关键代码**：`lib/notion-client.ts`

```typescript
import { normalizeCdnUrl } from './utils';

// 读取 Notion 数据时自动转换
lessons.push({
  coverImg: normalizeCdnUrl(getUrl(props.Cover_Img)),  // ← 自动转换
  videoUrl: normalizeCdnUrl(getUrl(props.Video_URL)),  // ← 自动转换
  // ...
});
```

**转换逻辑**：`lib/utils.ts`

```typescript
export function normalizeCdnUrl(url: string): string {
  if (!url) return '';
  
  const OSS_BUCKET_DOMAIN = 'aesthetic-assets.oss-cn-hongkong.aliyuncs.com';
  const CDN_DOMAIN = process.env.OSS_CDN_DOMAIN || 
    'https://assets.aestheticenglish.com';
  
  // 1. 强制 HTTPS
  let normalized = url.replace(/^http:\/\//i, 'https://');
  
  // 2. 替换 OSS 域名为 CDN 域名
  if (normalized.includes(OSS_BUCKET_DOMAIN)) {
    normalized = normalized.replace(
      OSS_BUCKET_DOMAIN, 
      CDN_DOMAIN.replace('https://', '')
    );
  }
  
  return normalized;
}
```

**转换示例**：
```
输入（Notion 中存储）：
http://aesthetic-assets.oss-cn-hongkong.aliyuncs.com/videos/daily-01.mp4

输出（前端使用）：
https://assets.aestheticenglish.com/videos/daily-01.mp4
```

**结果**：✅ 前端自动使用 CDN 链接，加载速度快

---

### 4️⃣ 布局管理器阶段 ✅

#### 入口
```
/admin/layout-manager
```

#### 功能
1. **拖拽排序**
   - 从 Available Pool 拖到 Featured 区域
   - 调整顺序（Sort_Order 自动更新）

2. **预览**
   - 实时预览封面图片
   - 图片自动使用 CDN 链接 ✅

3. **保存**
   - 更新 Notion 的 Display_Position 和 Sort_Order

**CDN 支持**：
```typescript
// 布局管理器中的图片也会自动转换
<img 
  src={lesson.coverImg}  // ← 已经是 CDN 链接
  alt={lesson.titleEn} 
/>
```

**结果**：✅ 布局管理器正常工作，图片加载快

---

## 🔍 API 缓存机制

### ISR 缓存（5分钟）

**所有布局 API 都有缓存**：

```typescript
// app/api/dashboard-layout/route.ts
export const revalidate = 300;  // 5分钟

// app/api/daily-cinema-layout/route.ts
export const revalidate = 300;

// app/api/cognitive-featured-layout/route.ts
export const revalidate = 300;

// app/api/business-featured-layout/route.ts
export const revalidate = 300;
```

### 缓存影响

**场景1：删除 Notion 数据后**
- ❌ 立即刷新页面 → 仍显示旧数据（缓存未过期）
- ✅ 5分钟后刷新 → 显示空状态
- ✅ 硬刷新（Cmd+Shift+R）→ 清除浏览器缓存，但 API 缓存仍在
- ✅ 重启 dev server → 清除所有缓存

**场景2：上传新课程后**
- ❌ 立即刷新页面 → 可能看不到新课程
- ✅ 5分钟后刷新 → 显示新课程
- ✅ 访问 `/api/dashboard-layout` → 触发缓存刷新

### 清除缓存方法

**方法1：重启 dev server**
```bash
# 停止当前 dev server (Ctrl+C)
rm -rf .next
npm run dev
```

**方法2：等待5分钟**
```
缓存自动过期
```

**方法3：访问 API 端点**
```
http://localhost:3000/api/dashboard-layout
```

---

## 🎯 完整测试流程

### 测试1：上传新课程

1. **访问** `/admin/publish?password=你的密码`
2. **上传文件**
   - 视频：`test-video.mp4`
   - 封面：`test-cover.jpg`
   - 字幕：`test-video.srt`
3. **填写信息**
   - Lesson ID: `daily-test-01`
   - 标题：Test Video
   - 分类：Daily
   - 期数：01
4. **点击发布**
5. **检查 Notion**
   - 课程已创建 ✅
   - Video_URL: `http://aesthetic-assets.oss-cn-hongkong.aliyuncs.com/videos/test-video.mp4`
   - Cover_Img: `http://aesthetic-assets.oss-cn-hongkong.aliyuncs.com/images/test-cover.jpg`
6. **修改 Status** → `Published`
7. **等待5分钟或重启 dev server**
8. **访问** `/api/lessons`
9. **检查返回数据**
   ```json
   {
     "videoUrl": "https://assets.aestheticenglish.com/videos/test-video.mp4",
     "coverImg": "https://assets.aestheticenglish.com/images/test-cover.jpg"
   }
   ```
   ✅ URL 已自动转换为 CDN 链接

---

### 测试2：布局管理器

1. **访问** `/admin/layout-manager?password=你的密码`
2. **检查 Available Pool**
   - 显示所有 `available-pool` 的课程
   - 图片正常加载（CDN 链接）✅
3. **拖拽到 Featured**
   - 拖动课程到 Dashboard Featured 区域
   - 点击 Save
4. **检查 Notion**
   - Display_Position: `dashboard-featured` ✅
   - Sort_Order: 0-7 ✅
5. **等待5分钟或重启 dev server**
6. **访问** `/dashboard`
7. **检查首页**
   - 课程显示在正确位置 ✅
   - 图片加载正常（CDN 链接）✅

---

### 测试3：视频播放

1. **访问** `/dashboard/courses/daily-test-01`
2. **检查视频**
   - 视频 URL: `https://assets.aestheticenglish.com/videos/test-video.mp4` ✅
   - 视频可以播放 ✅
   - 字幕显示正常 ✅
3. **检查封面**
   - 封面 URL: `https://assets.aestheticenglish.com/images/test-cover.jpg` ✅
   - 封面加载正常 ✅

---

## 📊 工作流评分

| 阶段 | 状态 | CDN 支持 | 说明 |
|------|------|----------|------|
| 上传到 OSS | ✅ 正常 | ✅ 是 | 文件上传到 OSS，返回原始 URL |
| 写入 Notion | ✅ 正常 | ✅ 是 | 存储原始 OSS URL |
| 前端读取 | ✅ 正常 | ✅ 是 | 自动转换为 CDN URL |
| 视频播放 | ✅ 正常 | ✅ 是 | 使用 CDN 加速 |
| 图片显示 | ✅ 正常 | ✅ 是 | 使用 CDN 加速 |
| 布局管理 | ✅ 正常 | ✅ 是 | 预览图使用 CDN |
| API 缓存 | ⚠️ 注意 | - | 5分钟缓存，需等待或重启 |

**总体评分**：⭐⭐⭐⭐⭐ (5/5) - 完美

---

## ⚠️ 注意事项

### 1. 文件命名规范
- ✅ 使用纯英文文件名（如 `daily-01.mp4`）
- ❌ 避免中文文件名（如 `每日英语-01.mp4`）
- ❌ 避免特殊字符（如 `video#01.mp4`）

### 2. 缓存问题
- 上传新课程后，需等待 5 分钟或重启 dev server
- 删除课程后，需等待 5 分钟或重启 dev server
- 硬刷新（Cmd+Shift+R）只清除浏览器缓存，不清除 API 缓存

### 3. Notion 字段
- Status 必须是 `Published` 才能被前端读取
- Display_Position 决定显示位置
- Sort_Order 决定显示顺序（0-7）

### 4. CDN 域名
- 确保 `.env.local` 中设置了 `OSS_CDN_DOMAIN`
- 格式：`https://assets.aestheticenglish.com`（不要末尾斜杠）

---

## ✅ 结论

**CDN 集成后工作流完全正常**！

**优势**：
- ✅ 上传流程不变（仍然上传到 OSS）
- ✅ Notion 存储不变（仍然存原始 URL）
- ✅ 前端自动转换（无需手动修改）
- ✅ 加载速度提升（CDN 加速）
- ✅ 布局管理器正常（预览图加速）

**唯一注意**：
- ⚠️ API 有 5 分钟缓存，更新后需等待或重启

**推荐工作流**：
1. 上传课程 → Notion
2. 审核内容 → 修改 Status 为 Published
3. 布局管理器 → 拖拽排版
4. **重启 dev server** → 清除缓存
5. 刷新页面 → 查看效果

完美！🎉



