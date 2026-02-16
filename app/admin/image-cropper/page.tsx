"use client";

import { useState, useRef } from "react";
import { ArrowLeft, Download, Upload, AlertCircle } from "lucide-react";
import Link from "next/link";

type AspectRatio = "1:1" | "3:4" | "9:16" | "16:9";

export default function ImageCropperPage() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [croppedImages, setCroppedImages] = useState<Record<AspectRatio, string>>({
    "1:1": "",
    "3:4": "",
    "9:16": "",
    "16:9": "",
  });
  const [fileName, setFileName] = useState<string>("");
  const [fileType, setFileType] = useState<string>("image/jpeg");
  const [isGif, setIsGif] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理图片上传
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name.replace(/\.[^/.]+$/, "")); // 去掉扩展名
    setFileType(file.type); // 保存文件类型
    setIsGif(file.type === "image/gif");

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setOriginalImage(event.target?.result as string);
        cropToAllRatios(img, file.type);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // 裁剪到所有比例
  const cropToAllRatios = (img: HTMLImageElement, mimeType: string) => {
    const ratios: { ratio: AspectRatio; width: number; height: number }[] = [
      { ratio: "1:1", width: 1, height: 1 },
      { ratio: "3:4", width: 3, height: 4 },
      { ratio: "9:16", width: 9, height: 16 },
      { ratio: "16:9", width: 16, height: 9 },
    ];

    const results: Record<AspectRatio, string> = {
      "1:1": "",
      "3:4": "",
      "9:16": "",
      "16:9": "",
    };

    ratios.forEach(({ ratio, width, height }) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // 计算裁剪区域（居中裁剪）
      const targetRatio = width / height;
      const imgRatio = img.width / img.height;

      let sourceWidth, sourceHeight, sourceX, sourceY;

      if (imgRatio > targetRatio) {
        // 图片更宽，裁剪左右
        sourceHeight = img.height;
        sourceWidth = img.height * targetRatio;
        sourceX = (img.width - sourceWidth) / 2;
        sourceY = 0;
      } else {
        // 图片更高，裁剪上下
        sourceWidth = img.width;
        sourceHeight = img.width / targetRatio;
        sourceX = 0;
        sourceY = (img.height - sourceHeight) / 2;
      }

      // 设置输出尺寸（保持高质量）
      const outputWidth = Math.min(sourceWidth, 2000);
      const outputHeight = outputWidth / targetRatio;

      canvas.width = outputWidth;
      canvas.height = outputHeight;

      // 绘制裁剪后的图片
      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        outputWidth,
        outputHeight
      );

      // 根据原始文件类型选择输出格式
      if (mimeType === "image/gif") {
        results[ratio] = canvas.toDataURL("image/png", 1.0); // GIF 转为 PNG（只保留第一帧）
      } else if (mimeType === "image/png") {
        results[ratio] = canvas.toDataURL("image/png", 1.0);
      } else {
        results[ratio] = canvas.toDataURL("image/jpeg", 0.95);
      }
    });

    setCroppedImages(results);
  };

  // 下载图片
  const downloadImage = (dataUrl: string, ratio: AspectRatio) => {
    const link = document.createElement("a");
    link.href = dataUrl;
    
    // 根据文件类型选择扩展名
    let extension = "jpg";
    if (fileType === "image/png" || fileType === "image/gif") {
      extension = "png";
    }
    
    link.download = `${fileName}_${ratio.replace(":", "x")}.${extension}`;
    link.click();
  };

  // 下载所有图片
  const downloadAll = () => {
    Object.entries(croppedImages).forEach(([ratio, dataUrl]) => {
      if (dataUrl) {
        setTimeout(() => {
          downloadImage(dataUrl, ratio as AspectRatio);
        }, 100);
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#F7F8F9] text-[#2D0F15] p-8">
      {/* 顶部导航 */}
      <header className="mb-12 flex items-center justify-between">
        <Link
          href="/admin"
          className="flex items-center gap-2 text-sm opacity-60 hover:opacity-100 transition-opacity"
        >
          <ArrowLeft size={16} />
          <span>返回管理后台</span>
        </Link>
      </header>

      {/* 标题 */}
      <div className="max-w-6xl mx-auto mb-12">
        <h1 className="font-serif text-5xl font-bold mb-4">图片裁剪工具</h1>
        <p className="text-[#2D0F15]/60">
          自动裁剪图片为 16:9、1:1、3:4、9:16 四种比例
        </p>
      </div>

      {/* GIF 警告 */}
      {isGif && (
        <div className="max-w-6xl mx-auto mb-8">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle size={20} className="text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-orange-800 font-medium mb-1">
                GIF 动画提示
              </p>
              <p className="text-sm text-orange-700 mb-3">
                由于浏览器限制，GIF 动画裁剪后会转换为 PNG 静态图片（仅保留第一帧）。
                如需保持动画效果，请使用在线 GIF 编辑工具：
              </p>
              <div className="flex flex-wrap gap-2">
                <a
                  href="https://ezgif.com/crop"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-orange-300 rounded text-xs text-orange-800 hover:bg-orange-100 transition-colors"
                >
                  <span>ezgif.com</span>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                <a
                  href="https://www.iloveimg.com/crop-image/crop-gif"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-orange-300 rounded text-xs text-orange-800 hover:bg-orange-100 transition-colors"
                >
                  <span>iLoveIMG</span>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                <a
                  href="https://www.img2go.com/crop-gif"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-orange-300 rounded text-xs text-orange-800 hover:bg-orange-100 transition-colors"
                >
                  <span>IMG2GO</span>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 上传区域 */}
      <div className="max-w-6xl mx-auto mb-12">
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-[#2D0F15]/20 rounded-lg p-12 text-center cursor-pointer hover:border-[#2D0F15]/40 transition-colors"
        >
          <Upload size={48} className="mx-auto mb-4 opacity-40" />
          <p className="text-lg mb-2">点击上传图片</p>
          <p className="text-sm text-[#2D0F15]/60">支持 JPG、PNG、GIF 格式</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* 原图预览 */}
      {originalImage && (
        <div className="max-w-6xl mx-auto mb-12">
          <h2 className="font-serif text-2xl font-bold mb-6">原图预览</h2>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <img
              src={originalImage}
              alt="Original"
              className="max-w-full max-h-96 mx-auto object-contain"
            />
          </div>
        </div>
      )}

      {/* 裁剪结果 */}
      {croppedImages["1:1"] && (
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-2xl font-bold">裁剪结果</h2>
            <button
              onClick={downloadAll}
              className="flex items-center gap-2 px-6 py-3 bg-[#2D0F15] text-[#F7F8F9] rounded-lg hover:bg-[#2D0F15]/90 transition-colors"
            >
              <Download size={18} />
              <span>下载全部</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {(["16:9", "1:1", "3:4", "9:16"] as AspectRatio[]).map((ratio) => (
              <div key={ratio} className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif text-xl font-bold">{ratio}</h3>
                  <button
                    onClick={() => downloadImage(croppedImages[ratio], ratio)}
                    className="text-sm px-4 py-2 border border-[#2D0F15]/20 rounded hover:bg-[#2D0F15]/5 transition-colors"
                  >
                    下载
                  </button>
                </div>
                <div className="bg-[#F7F8F9] rounded-lg overflow-hidden flex items-center justify-center p-4">
                  <img
                    src={croppedImages[ratio]}
                    alt={`Cropped ${ratio}`}
                    className="max-w-full max-h-96 object-contain"
                  />
                </div>
                <p className="text-xs text-[#2D0F15]/60 mt-4 text-center">
                  {ratio === "16:9" && "横屏 - 适合视频封面"}
                  {ratio === "1:1" && "方形 - 适合社交媒体"}
                  {ratio === "3:4" && "竖屏 - 适合卡片展示"}
                  {ratio === "9:16" && "超竖屏 - 适合手机全屏"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

