// ============================================================
// 阿里云 OSS 上传工具 - 管理后台
// ============================================================

'use client';

import { useState } from 'react';
import { Upload, Copy, Check, Image, Video, FileText } from 'lucide-react';

export default function AdminUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [uploadHistory, setUploadHistory] = useState<Array<{
    name: string;
    url: string;
    type: string;
    time: string;
  }>>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUploadedUrl('');
      setCopied(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);

    try {
      // 模拟上传（实际使用时需要配置 OSS SDK）
      // const OSS = require('ali-oss');
      // const client = new OSS({
      //   region: process.env.NEXT_PUBLIC_OSS_REGION,
      //   accessKeyId: process.env.NEXT_PUBLIC_OSS_KEY_ID,
      //   accessKeySecret: process.env.NEXT_PUBLIC_OSS_KEY_SECRET,
      //   bucket: process.env.NEXT_PUBLIC_OSS_BUCKET,
      // });
      
      // const filename = `${Date.now()}-${file.name}`;
      // const folder = file.type.startsWith('video/') ? 'videos' : 'images';
      // const result = await client.put(`${folder}/${filename}`, file);
      
      // 模拟延迟
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 模拟生成的 URL
      const mockUrl = `https://aesthetic-assets.oss-cn-hongkong.aliyuncs.com/${file.type.startsWith('video/') ? 'videos' : 'images'}/${Date.now()}-${file.name}`;
      
      setUploadedUrl(mockUrl);
      
      // 添加到历史记录
      setUploadHistory(prev => [{
        name: file.name,
        url: mockUrl,
        type: file.type,
        time: new Date().toLocaleString('zh-CN'),
      }, ...prev]);
      
      // 自动复制到剪贴板
      navigator.clipboard.writeText(mockUrl);
      setCopied(true);
      
    } catch (error) {
      console.error('Upload failed:', error);
      alert('上传失败，请检查 OSS 配置');
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('video/')) return <Video size={20} />;
    if (type.startsWith('image/')) return <Image size={20} />;
    return <FileText size={20} />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">媒体上传工具</h1>
          <p className="text-slate-600">上传视频和图片到阿里云 OSS，获取 URL 用于 Notion</p>
        </div>

        {/* Upload Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          
          {/* File Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              选择文件
            </label>
            <div className="relative">
              <input
                type="file"
                accept="video/*,image/*"
                onChange={handleFileSelect}
                className="block w-full text-sm text-slate-500
                  file:mr-4 file:py-3 file:px-6
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100
                  cursor-pointer"
              />
            </div>
            {file && (
              <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                {getFileIcon(file.type)}
                <span>{file.name}</span>
                <span className="text-slate-400">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
              </div>
            )}
          </div>

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 
              text-white font-semibold py-4 px-6 rounded-xl
              transition-all duration-200 flex items-center justify-center gap-2
              disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                上传中...
              </>
            ) : (
              <>
                <Upload size={20} />
                上传到 OSS
              </>
            )}
          </button>

          {/* Result */}
          {uploadedUrl && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-900 mb-1">上传成功！</p>
                  <p className="text-sm text-green-700 break-all font-mono">{uploadedUrl}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(uploadedUrl)}
                  className="flex-shrink-0 p-2 hover:bg-green-100 rounded-lg transition-colors"
                  title="复制 URL"
                >
                  {copied ? <Check size={20} className="text-green-600" /> : <Copy size={20} className="text-green-600" />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Upload History */}
        {uploadHistory.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">上传历史</h2>
            <div className="space-y-3">
              {uploadHistory.map((item, index) => (
                <div key={index} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                  <div className="text-slate-600">
                    {getFileIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.time}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(item.url)}
                    className="flex-shrink-0 p-2 hover:bg-slate-200 rounded-lg transition-colors"
                    title="复制 URL"
                  >
                    <Copy size={16} className="text-slate-600" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-xl">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">⚠️ 使用说明</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 当前为演示模式，需要配置 OSS 才能真正上传</li>
            <li>• 配置方法：在 <code className="bg-blue-100 px-1 rounded">.env.local</code> 中填写 OSS 密钥</li>
            <li>• 上传成功后 URL 会自动复制到剪贴板</li>
            <li>• 将 URL 粘贴到 Notion 的 Cover_URL 或 Video_URL 字段</li>
          </ul>
        </div>

      </div>
    </div>
  );
}

