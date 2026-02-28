'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';

type Tool = 'collage' | 'crop';

export default function CollageMakerPage() {
  const [activeTool, setActiveTool] = useState<Tool>('collage');
  
  // 拼图相关状态
  const [images, setImages] = useState<string[]>([]);
  const [collageUrl, setCollageUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // 裁剪相关状态
  const [cropImage, setCropImage] = useState<string>('');
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 100, height: 100 });
  const [croppedUrl, setCroppedUrl] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cropFileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cropCanvasRef = useRef<HTMLCanvasElement>(null);
  const cropImageRef = useRef<HTMLImageElement>(null);

  // ========== 拼图功能 ==========
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: string[] = [];
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          newImages.push(event.target.result as string);
          if (newImages.length === files.length) {
            setImages((prev) => [...prev, ...newImages]);
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === images.length - 1)
    ) {
      return;
    }

    const newImages = [...images];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newImages[index], newImages[targetIndex]] = [
      newImages[targetIndex],
      newImages[index],
    ];
    setImages(newImages);
  };

  const generateCollage = async () => {
    if (images.length === 0) return;

    setIsGenerating(true);
    setCollageUrl('');

    try {
      // 加载所有图片
      const loadedImages = await Promise.all(
        images.map((src) => {
          return new Promise<HTMLImageElement>((resolve, reject) => {
            const img = document.createElement('img');
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
          });
        })
      );

      // 计算画布尺寸
      const maxWidth = Math.max(...loadedImages.map((img) => img.width));
      const totalHeight = loadedImages.reduce((sum, img) => sum + img.height, 0);

      // 创建画布
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = maxWidth;
      canvas.height = totalHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 绘制图片
      let currentY = 0;
      loadedImages.forEach((img) => {
        const x = (maxWidth - img.width) / 2; // 居中
        ctx.drawImage(img, x, currentY);
        currentY += img.height;
      });

      // 生成结果
      const dataUrl = canvas.toDataURL('image/png');
      setCollageUrl(dataUrl);
    } catch (error) {
      console.error('生成拼图失败:', error);
      alert('生成拼图失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadCollage = () => {
    if (!collageUrl) return;

    const link = document.createElement('a');
    link.download = `collage-${Date.now()}.png`;
    link.href = collageUrl;
    link.click();
  };

  const clearAll = () => {
    setImages([]);
    setCollageUrl('');
  };

  // ========== 裁剪功能 ==========
  const handleCropFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setCropImage(event.target.result as string);
        setCroppedUrl('');
        // 重置裁剪区域
        setCropArea({ x: 10, y: 10, width: 80, height: 80 });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCrop = async () => {
    if (!cropImage || !cropImageRef.current) return;

    const img = cropImageRef.current;
    const canvas = cropCanvasRef.current;
    if (!canvas) return;

    // 计算实际像素位置
    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;

    const cropX = (cropArea.x / 100) * img.width * scaleX;
    const cropY = (cropArea.y / 100) * img.height * scaleY;
    const cropWidth = (cropArea.width / 100) * img.width * scaleX;
    const cropHeight = (cropArea.height / 100) * img.height * scaleY;

    canvas.width = cropWidth;
    canvas.height = cropHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(
      img,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight
    );

    const dataUrl = canvas.toDataURL('image/png');
    setCroppedUrl(dataUrl);
  };

  const downloadCropped = () => {
    if (!croppedUrl) return;

    const link = document.createElement('a');
    link.download = `cropped-${Date.now()}.png`;
    link.href = croppedUrl;
    link.click();
  };

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-slate-900">图片工具箱</h1>
        <p className="text-slate-600 mb-8">拼图与裁剪工具集合</p>

        {/* 工具切换 */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTool('collage')}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              activeTool === 'collage'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            纵向拼图
          </button>
          <button
            onClick={() => setActiveTool('crop')}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              activeTool === 'crop'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            图片裁剪
          </button>
        </div>

        {/* 拼图工具 */}
        {activeTool === 'collage' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左侧：图片列表 */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-800">
                图片列表 ({images.length})
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  + 添加图片
                </button>
                {images.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors text-sm font-medium"
                  >
                    清空
                  </button>
                )}
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />

            {images.length === 0 ? (
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center">
                <div className="text-slate-400 mb-4">
                  <svg
                    className="w-16 h-16 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <p className="text-slate-600 font-medium mb-2">暂无图片</p>
                <p className="text-slate-500 text-sm">点击上方按钮添加图片</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {images.map((src, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <div className="relative w-20 h-20 flex-shrink-0 bg-white rounded-lg overflow-hidden border border-slate-200">
                      <Image
                        src={src}
                        alt={`图片 ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700">
                        图片 {index + 1}
                      </p>
                      <p className="text-xs text-slate-500">
                        位置: 第 {index + 1} 张
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => moveImage(index, 'up')}
                        disabled={index === 0}
                        className="p-1 text-slate-600 hover:bg-slate-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                        title="上移"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 15l7-7 7 7"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => moveImage(index, 'down')}
                        disabled={index === images.length - 1}
                        className="p-1 text-slate-600 hover:bg-slate-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                        title="下移"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                    </div>
                    <button
                      onClick={() => removeImage(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="删除"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {images.length > 0 && (
              <button
                onClick={generateCollage}
                disabled={isGenerating}
                className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? 'LOADING' : '生成拼图'}
              </button>
            )}
          </div>

          {/* 右侧：预览和下载 */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">
              拼图预览
            </h2>

            {collageUrl ? (
              <div className="space-y-4">
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                  <div className="max-h-[600px] overflow-y-auto">
                    <img
                      src={collageUrl}
                      alt="拼图结果"
                      className="w-full h-auto"
                    />
                  </div>
                </div>
                <button
                  onClick={downloadCollage}
                  className="w-full px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium"
                >
                  下载拼图
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center h-[600px] flex items-center justify-center">
                <div>
                  <div className="text-slate-400 mb-4">
                    <svg
                      className="w-16 h-16 mx-auto"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-slate-600 font-medium mb-2">暂无预览</p>
                  <p className="text-slate-500 text-sm">
                    添加图片后点击&quot;生成拼图&quot;查看效果
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        )}

        {/* 裁剪工具 */}
        {activeTool === 'crop' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 左侧：裁剪区域 */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-slate-800">选择裁剪区域</h2>
                <button
                  onClick={() => cropFileInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  上传图片
                </button>
              </div>

              <input
                ref={cropFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleCropFileSelect}
                className="hidden"
              />

              {cropImage ? (
                <div className="space-y-4">
                  <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                    <img
                      ref={cropImageRef}
                      src={cropImage}
                      alt="待裁剪图片"
                      className="w-full h-auto"
                    />
                    {/* 裁剪框 */}
                    <div
                      className="absolute border-2 border-blue-500 bg-blue-500/10"
                      style={{
                        left: `${cropArea.x}%`,
                        top: `${cropArea.y}%`,
                        width: `${cropArea.width}%`,
                        height: `${cropArea.height}%`,
                        cursor: 'move',
                      }}
                    >
                      {/* 四个角的调整点 */}
                      <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded-full"></div>
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"></div>
                      <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 rounded-full"></div>
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"></div>
                    </div>
                  </div>

                  {/* 裁剪区域调整 */}
                  <div className="space-y-3 bg-slate-50 p-4 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1 block">
                        X 位置: {cropArea.x.toFixed(0)}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={cropArea.x}
                        onChange={(e) =>
                          setCropArea({ ...cropArea, x: Number(e.target.value) })
                        }
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1 block">
                        Y 位置: {cropArea.y.toFixed(0)}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={cropArea.y}
                        onChange={(e) =>
                          setCropArea({ ...cropArea, y: Number(e.target.value) })
                        }
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1 block">
                        宽度: {cropArea.width.toFixed(0)}%
                      </label>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={cropArea.width}
                        onChange={(e) =>
                          setCropArea({ ...cropArea, width: Number(e.target.value) })
                        }
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1 block">
                        高度: {cropArea.height.toFixed(0)}%
                      </label>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={cropArea.height}
                        onChange={(e) =>
                          setCropArea({ ...cropArea, height: Number(e.target.value) })
                        }
                        className="w-full"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleCrop}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-medium"
                  >
                    裁剪图片
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center">
                  <div className="text-slate-400 mb-4">
                    <svg
                      className="w-16 h-16 mx-auto"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-slate-600 font-medium mb-2">暂无图片</p>
                  <p className="text-slate-500 text-sm">点击上方按钮上传图片</p>
                </div>
              )}
            </div>

            {/* 右侧：裁剪结果 */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">裁剪结果</h2>

              {croppedUrl ? (
                <div className="space-y-4">
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 p-4">
                    <img
                      src={croppedUrl}
                      alt="裁剪结果"
                      className="w-full h-auto"
                    />
                  </div>
                  <button
                    onClick={downloadCropped}
                    className="w-full px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium"
                  >
                    下载裁剪图片
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center h-[600px] flex items-center justify-center">
                  <div>
                    <div className="text-slate-400 mb-4">
                      <svg
                        className="w-16 h-16 mx-auto"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z"
                        />
                      </svg>
                    </div>
                    <p className="text-slate-600 font-medium mb-2">暂无结果</p>
                    <p className="text-slate-500 text-sm">
                      上传图片并调整裁剪区域后点击&quot;裁剪图片&quot;
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 隐藏的画布 */}
        <canvas ref={canvasRef} className="hidden" />
        <canvas ref={cropCanvasRef} className="hidden" />
      </div>
    </div>
  );
}
