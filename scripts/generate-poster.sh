#!/bin/bash

# 🎨 视频封面图自动生成脚本
# 
# 功能：从视频中提取第一帧作为封面图（poster）
# 效果：视频加载前显示封面，用户体验提升 10 倍！
#
# 使用方法：
#   chmod +x generate-poster.sh
#   ./generate-poster.sh input.mp4 output.jpg

set -e

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 检查参数
if [ $# -lt 2 ]; then
    echo -e "${RED}❌ 用法错误${NC}"
    echo "用法: $0 <视频文件> <输出图片>"
    echo "示例: $0 video.mp4 poster.jpg"
    exit 1
fi

INPUT_VIDEO="$1"
OUTPUT_IMAGE="$2"

# 检查 ffmpeg
if ! command -v ffmpeg &> /dev/null; then
    echo -e "${RED}❌ 错误: 未找到 ffmpeg${NC}"
    echo "请先安装: brew install ffmpeg"
    exit 1
fi

# 检查输入文件
if [ ! -f "$INPUT_VIDEO" ]; then
    echo -e "${RED}❌ 错误: 视频文件不存在: $INPUT_VIDEO${NC}"
    exit 1
fi

echo -e "${YELLOW}📸 正在生成封面图...${NC}"

# 提取第 2 秒的帧（避免黑屏）
ffmpeg -i "$INPUT_VIDEO" \
    -ss 00:00:02 \
    -vframes 1 \
    -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2" \
    -q:v 2 \
    "$OUTPUT_IMAGE" \
    -y \
    -loglevel error

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 封面图生成成功: $OUTPUT_IMAGE${NC}"
    
    # 显示文件大小
    size=$(du -h "$OUTPUT_IMAGE" | cut -f1)
    echo "📦 文件大小: $size"
else
    echo -e "${RED}❌ 封面图生成失败${NC}"
    exit 1
fi

