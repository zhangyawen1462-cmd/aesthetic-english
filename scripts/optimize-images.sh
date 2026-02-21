#!/bin/bash

# 🖼️ 图片压缩脚本
# 使用 ImageMagick 或 sips (macOS 自带) 压缩图片

echo "🚀 开始优化图片..."

# 检查是否安装了 ImageMagick
if command -v convert &> /dev/null; then
    echo "✅ 使用 ImageMagick 压缩"
    
    # 压缩 gabby.png (1.4MB → ~200KB)
    if [ -f "public/gabby.png" ]; then
        echo "📦 压缩 gabby.png..."
        convert public/gabby.png -quality 85 -strip public/gabby-optimized.png
        echo "✅ 已生成 public/gabby-optimized.png"
    fi
    
    # 批量压缩 images 文件夹中的 JPG
    for img in public/images/**/*.jpg; do
        if [ -f "$img" ]; then
            echo "📦 压缩 $img..."
            convert "$img" -quality 80 -strip "${img%.jpg}-optimized.jpg"
        fi
    done
    
elif command -v sips &> /dev/null; then
    echo "✅ 使用 sips (macOS) 压缩"
    
    # 压缩 gabby.png
    if [ -f "public/gabby.png" ]; then
        echo "📦 压缩 gabby.png..."
        cp public/gabby.png public/gabby-optimized.png
        sips -Z 1024 public/gabby-optimized.png
        echo "✅ 已生成 public/gabby-optimized.png"
    fi
    
    # 批量压缩 JPG
    for img in public/images/**/*.jpg; do
        if [ -f "$img" ]; then
            echo "📦 压缩 $img..."
            cp "$img" "${img%.jpg}-optimized.jpg"
            sips -Z 1920 "${img%.jpg}-optimized.jpg"
        fi
    done
    
else
    echo "❌ 未找到图片压缩工具"
    echo "请安装 ImageMagick: brew install imagemagick"
    echo "或使用在线工具: https://tinypng.com/"
    exit 1
fi

echo ""
echo "✅ 压缩完成！"
echo ""
echo "📊 对比文件大小："
ls -lh public/gabby.png public/gabby-optimized.png 2>/dev/null || true
echo ""
echo "💡 下一步："
echo "1. 检查压缩后的图片质量"
echo "2. 如果满意，替换原文件: mv public/gabby-optimized.png public/gabby.png"
echo "3. 提交并部署"

