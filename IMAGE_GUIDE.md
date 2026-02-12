# 📸 幽灵图层背景图使用指南

## 概述
每个学习模块都添加了"幽灵图层"背景图，用于营造若隐若现的呼吸感氛围。图片需要放置在 `public/images/module-bg/` 目录下。

## 文件结构
```
public/
  └── images/
      └── module-bg/
          ├── script-desktop.jpg   (Script 模块 - 桌面端)
          ├── script-mobile.jpg    (Script 模块 - 移动端，可选)
          ├── blind.jpg            (Blind 模块 - 盲听)
          ├── vocab.jpg            (Vocab 模块)
          ├── grammar.jpg          (Grammar 模块)
          ├── recall.jpg           (Recall 模块)
          ├── shadow.jpg           (Shadow 模块)
          └── salon.jpg            (Salon 模块)
```

## 推荐图片规格

### 1. Script 模块（字幕阅读）
- **桌面端**: `script-desktop.jpg`
  - 推荐比例: **16:9 横向**
  - 推荐尺寸: 1920×1080px
  - 风格: 文字、书页、打字机
  
- **移动端**: `script-mobile.jpg` (可选)
  - 推荐比例: **9:16 竖向**
  - 推荐尺寸: 1080×1920px
  - 风格: 与桌面端相同主题

### 2. Blind 模块（盲听练习）
- 文件名: `blind.jpg`
- 推荐比例: **1:1 方形**
- 推荐尺寸: 1200×1200px
- 风格: 黑胶唱片、音乐播放器、耳机

### 3. Vocab 模块（词汇卡片）
- 文件名: `vocab.jpg`
- 推荐比例: **1:1 方形**
- 推荐尺寸: 1200×1200px
- 风格: 词典、笔记本、手写笔记

### 4. Grammar 模块（语法笔记）
- 文件名: `grammar.jpg`
- 推荐比例: **3:4 竖向**
- 推荐尺寸: 900×1200px
- 风格: 语法书、标注、学术笔记

### 5. Recall 模块（回译练习）
- 文件名: `recall.jpg`
- 推荐比例: **3:4 竖向**
- 推荐尺寸: 900×1200px
- 风格: 练习册、档案纸张、复古文档

### 6. Shadow 模块（跟读录音）
- 文件名: `shadow.jpg`
- 推荐比例: **16:9 横向**
- 推荐尺寸: 1920×1080px
- 风格: 录音棚、麦克风、声波

### 7. Salon 模块（讨论沙龙）
- 文件名: `salon.jpg`
- 推荐比例: **1:1 方形**
- 推荐尺寸: 1200×1200px
- 风格: 咖啡馆、书房、社交空间

## 图片处理建议

### 色彩
- **降低饱和度**: 建议使用黑白或低饱和度图片
- **色调**: 米色、棕色、灰色系为佳
- **避免**: 过于鲜艳的颜色会分散注意力

### 清晰度
- **轻微模糊**: 图片本身可以不必太清晰，代码中会添加 blur 滤镜
- **避免**: 过于复杂的细节

### 亮度
- **中低亮度**: 偏暗的图片效果更好
- **对比度**: 中等对比度即可

### 纹理感
- **推荐**: 纸张纹理、布料、木质、石材
- **避免**: 纯色渐变

## 视觉效果说明

每个模块的幽灵图层设置了不同的显示效果：

| 模块 | 不透明度 | 混合模式 | 滤镜效果 |
|------|---------|---------|---------|
| Script | 3% | multiply | blur(1px) + grayscale(40%) |
| Blind | 4% | multiply | blur(2px) + grayscale(70%) + contrast(1.1) |
| Vocab | 4% | soft-light | blur(2px) + sepia(20%) |
| Grammar | 3% | multiply | blur(1.5px) + grayscale(50%) |
| Recall | 3% | multiply | blur(1.5px) + grayscale(60%) |
| Shadow | 4% | overlay | blur(2px) + contrast(1.2) |
| Salon | 5% | soft-light | blur(3px) + sepia(30%) |

## 示例来源

可以从以下资源寻找合适的图片：
- **Unsplash**: 高质量免费图库
- **Pexels**: 免费商用图片
- **关键词参考**:
  - vintage paper texture
  - book pages close up
  - handwriting notes
  - typewriter aesthetic
  - microphone studio
  - coffee shop atmosphere
  - library bookshelf
  
## 注意事项

1. **版权**: 确保图片有使用权限
2. **文件大小**: 建议每张图片 < 500KB（会被模糊处理，无需高清）
3. **格式**: JPG 格式即可（PNG 会增加加载时间）
4. **备选方案**: 如果暂时没有图片，留空即可，背景会显示纯色

## 测试建议

上传图片后，在不同主题（Daily/Cognitive/Business）下测试效果：
1. 检查图片是否过于抢眼
2. 确认文字内容清晰可读
3. 测试移动端和桌面端显示效果

---

**需要帮助？** 可以先上传1-2张测试图看看效果，再批量制作其他图片。
