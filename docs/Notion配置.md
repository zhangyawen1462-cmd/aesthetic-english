# 📚 Notion 数据库配置完整指南

## 🎯 第一步：创建 Notion Integration

1. 访问 [Notion Integrations](https://www.notion.so/my-integrations)
2. 点击 **"+ New integration"**
3. 填写信息：
   - **Name**: `Aesthetic English API`
   - **Associated workspace**: 选择你的工作区
   - **Type**: Internal
4. 点击 **Submit**
5. 复制 **Internal Integration Token**（以 `secret_` 开头）
6. 粘贴到 `.env.local` 的 `NOTION_API_KEY`

---

## 📊 第二步：配置数据库

### **Database 1: Lessons（课程主表）**

**如果已存在**：添加以下新字段

**如果不存在**：创建新数据库并添加所有字段

#### 必需字段：

| 属性名 | 类型 | 选项/说明 |
|--------|------|----------|
| **ID** | Title | 课程唯一标识（如 `daily-01`） |
| **Category** | Select | `Daily`, `Cognitive`, `Business` |
| **EP** | Number | 期号（如 `1`, `2`, `3`） |
| **Title_CN** | Text | 中文标题 |
| **Title_EN** | Text | 英文标题 |
| **Cover_URL** | URL | 精选封面链接 |
| **Cover_URL_16_9** | URL | 归档封面链接（16:9） |
| **Cover_Ratio** | Select | `3/4`, `1/1`, `9/16` |
| **Video_URL** | URL | 视频链接 |
| **Date** | Date | 发布日期 |
| **SRT_Raw** | Text | 完整字幕文本（多行） |
| **Status** | Select | `Draft`, `Published` |
| **Display_Type** | Select | `video`, `image`, `mood` |
| **Display_Position** | Select | `dashboard-featured`, `daily-video`, `daily-mood`, `cognitive-featured`, `business-featured`, `none` |
| **Sort_Order** | Number | 排序顺序（1, 2, 3...） |

#### 字段说明：

**Display_Type**（展示类型）：
- `video` - 视频课程（有标题、有视频）
- `image` - 图片课程（有标题、只有图片）
- `mood` - 氛围卡片（只有图片，无标题）

**Display_Position**（展示位置）：
- `dashboard-featured` - Dashboard 精选
- `daily-video` - Daily Cinema 视频区（随机显示 3-4 期）
- `daily-mood` - Daily Cinema 氛围卡片区
- `cognitive-featured` - Cognitive 精选（显示前 2 期）
- `business-featured` - Business 精选（显示前 2 期）
- `none` - 只在 Archives 显示

**Sort_Order**（排序顺序）：
- 数字类型，数字越小越靠前
- 用于控制同一位置内的显示顺序
- 例如：Sort_Order = 1 的课程会显示在 Sort_Order = 2 之前

**Cover_Ratio**（封面比例）：
- `3/4` - 标准竖屏
- `1/1` - 正方形
- `9/16` - 超竖屏

---

### **Database 2: Vocabulary（词汇表）**

创建新数据库，命名为 `Vocabulary`

| 属性名 | 类型 | 说明 |
|--------|------|------|
| **Word** | Title | 单词 |
| **Lesson** | Relation | 关联到 `Lessons` 数据库 |
| **Phonetic** | Text | 音标 |
| **Definition** | Text | 英文释义 |
| **Definition_CN** | Text | 中文释义 |
| **Example** | Text | 例句 |

---

### **Database 3: Grammar（语法表）**

创建新数据库，命名为 `Grammar`

| 属性名 | 类型 | 说明 |
|--------|------|------|
| **Point** | Title | 语法点标题 |
| **Lesson** | Relation | 关联到 `Lessons` 数据库 |
| **Description** | Text | 详细解析（多行） |
| **Example** | Text | 举例 |

---

### **Database 4: Recall（回译表）**

创建新数据库，命名为 `Recall`

| 属性名 | 类型 | 说明 |
|--------|------|------|
| **Text_CN** | Title | 中文文本 |
| **Text_EN** | Text | 英文文本（多行） |
| **Lesson** | Relation | 关联到 `Lessons` 数据库 |

---

## 🔑 第三步：获取数据库 ID

### 方法：从 URL 中提取

1. 打开 Notion 数据库页面
2. 查看浏览器地址栏的 URL
3. 找到 32 位字符的 ID

**URL 格式**：
```
https://www.notion.so/workspace/数据库名称-{32位ID}?v=...
```

**示例**：
```
https://www.notion.so/myworkspace/Lessons-1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p?v=...
                                        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                        去掉连字符后填入 .env.local
```

---

## 🔧 第四步：配置环境变量

在 `.env.local` 中添加：

```bash
# Notion API
NOTION_API_KEY=secret_xxxxx
NOTION_DB_LESSONS=xxxxx
NOTION_DB_VOCABULARY=xxxxx
NOTION_DB_GRAMMAR=xxxxx
NOTION_DB_RECALL=xxxxx

# DeepSeek AI
DEEPSEEK_API_KEY=sk-xxxxx

# Cloudflare R2
R2_ACCOUNT_ID=xxxxx
R2_ACCESS_KEY_ID=xxxxx
R2_SECRET_ACCESS_KEY=xxxxx
R2_BUCKET_NAME=xxxxx
R2_PUBLIC_URL=https://xxxxx
```

---

## ✅ 第五步：共享数据库

**重要**：每个数据库都需要共享给 Integration

1. 打开数据库页面
2. 点击右上角 **Share**
3. 点击 **Invite**
4. 选择你创建的 Integration（`Aesthetic English API`）
5. 点击 **Invite**

**需要共享的数据库**：
- [ ] Lessons
- [ ] Vocabulary
- [ ] Grammar
- [ ] Recall

---

## 🧪 第六步：测试配置

1. 重启开发服务器：
```bash
npm run dev
```

2. 访问测试端点：
   - http://localhost:8080/api/lessons
   - http://localhost:8080/api/lessons/test-01

3. 如果看到 JSON 数据，说明配置成功！

---

## 📋 使用场景示例

### 场景 1：Dashboard 精选视频（最优先显示）
```
ID: daily-01
Display_Type: video
Display_Position: dashboard-featured
Sort_Order: 1  ← 数字越小越靠前
Cover_Ratio: 3/4
```

### 场景 2：Daily Cinema 视频（随机显示 3-4 期）
```
ID: daily-02
Display_Type: video
Display_Position: daily-video
Sort_Order: 2  ← 在候选池中的优先级
Cover_Ratio: 9/16
```

### 场景 3：Cognitive 精选（显示前 2 期）
```
ID: cognitive-01
Display_Type: video
Display_Position: cognitive-featured
Sort_Order: 1  ← 第一个显示
Cover_Ratio: 16/9（使用 Cover_URL）
```

### 场景 4：只在 Archives 显示
```
ID: daily-03
Display_Type: video
Display_Position: none
Sort_Order: 10  ← 在 Archives 中的排序
```

---

## 🔧 常见问题

### Q: API 返回 401 错误
**A:** 检查 `NOTION_API_KEY` 是否正确，确保以 `secret_` 开头

### Q: API 返回空数组
**A:** 检查数据库是否共享给了 Integration，Status 是否为 `Published`

### Q: 找不到数据库 ID
**A:** 打开数据库页面，URL 格式为 `https://www.notion.so/xxxxx?v=yyyyy`，其中 `xxxxx` 就是 ID（去掉连字符）

### Q: Relation 字段无法关联
**A:** 确保两个数据库都共享给了同一个 Integration

---

## ✅ 配置检查清单

完成后确认：

- [ ] 已创建 Notion Integration
- [ ] Lessons 数据库包含所有必需字段
- [ ] Vocabulary 数据库已创建
- [ ] Grammar 数据库已创建
- [ ] Recall 数据库已创建
- [ ] 所有数据库已共享给 Integration
- [ ] 已获取所有数据库 ID
- [ ] 已配置 .env.local
- [ ] 已重启开发服务器
- [ ] API 测试通过

---

配置完成后，就可以使用自动化发布台了！🚀

