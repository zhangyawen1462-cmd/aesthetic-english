'use client';

import { useState } from 'react';
import { Link as LinkIcon, Copy, Check, ArrowRight } from 'lucide-react';

export default function LinkConverterPage() {
  const [inputLinks, setInputLinks] = useState('');
  const [convertedLinks, setConvertedLinks] = useState('');
  const [copied, setCopied] = useState(false);

  const convertLinks = () => {
    if (!inputLinks.trim()) {
      alert('请先粘贴 OSS 链接');
      return;
    }

    // 按行分割输入
    const lines = inputLinks.split('\n');
    const converted = lines.map(line => {
      const trimmed = line.trim();
      if (!trimmed) return '';

      // 替换 OSS 域名为 CDN 域名
      let newLink = trimmed.replace(
        /aesthetic-assets\.oss-cn-hongkong\.aliyuncs\.com/g,
        'assets.aestheticenglish.com'
      );

      // 处理中文编码：提取路径部分并编码
      try {
        const url = new URL(newLink);
        // 对路径进行编码，但保留斜杠
        const encodedPath = url.pathname.split('/').map(segment => {
          // 如果包含中文或特殊字符，进行编码
          if (/[^\x00-\x7F]/.test(segment)) {
            return encodeURIComponent(segment);
          }
          return segment;
        }).join('/');
        
        newLink = `${url.protocol}//${url.host}${encodedPath}${url.search}${url.hash}`;
      } catch (e) {
        // 如果不是完整 URL，直接返回
        console.warn('无法解析 URL:', trimmed);
      }

      return newLink;
    }).filter(link => link); // 过滤空行

    setConvertedLinks(converted.join('\n'));
  };

  const copyToClipboard = async () => {
    if (!convertedLinks) return;

    try {
      await navigator.clipboard.writeText(convertedLinks);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      alert('复制失败，请手动复制');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        
        {/* 标题 */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl mb-4">
            <LinkIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            🔗 OSS 链接转换器
          </h1>
          <p className="text-slate-300">
            一键将旧的 OSS 链接转换为正式 CDN 链接
          </p>
        </div>

        {/* 主要内容 */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 sm:p-8 border border-white/20">
          
          {/* 输入框 */}
          <div className="mb-6">
            <label className="block text-white font-semibold mb-3 text-lg">
              📥 粘贴旧的 OSS 链接（支持多行）
            </label>
            <textarea
              value={inputLinks}
              onChange={(e) => setInputLinks(e.target.value)}
              placeholder="例如：&#10;https://aesthetic-assets.oss-cn-hongkong.aliyuncs.com/videos/示例视频.mp4&#10;https://aesthetic-assets.oss-cn-hongkong.aliyuncs.com/images/封面图.jpg"
              className="w-full h-48 bg-white/5 border border-white/30 rounded-xl p-4 text-white placeholder-slate-400 
                focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent resize-none
                font-mono text-sm"
            />
            <p className="text-slate-400 text-sm mt-2">
              💡 提示：可以一次粘贴多个链接，每行一个
            </p>
          </div>

          {/* 转换按钮 */}
          <button
            onClick={convertLinks}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 
              text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 
              flex items-center justify-center gap-3 text-lg shadow-lg hover:shadow-xl hover:scale-[1.02]"
          >
            <ArrowRight className="w-6 h-6" />
            一键变身正式链接
          </button>

          {/* 结果展示 */}
          {convertedLinks && (
            <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-3">
                <label className="text-white font-semibold text-lg">
                  ✅ 转换后的 CDN 链接
                </label>
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white 
                    px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      已复制
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      一键复制
                    </>
                  )}
                </button>
              </div>
              
              <div className="bg-white/5 border border-green-400/50 rounded-xl p-4 relative">
                <pre className="text-green-300 font-mono text-sm whitespace-pre-wrap break-all">
                  {convertedLinks}
                </pre>
              </div>

              <div className="mt-4 bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                <p className="text-green-300 text-sm">
                  🎉 转换成功！共处理 {convertedLinks.split('\n').length} 个链接
                </p>
              </div>
            </div>
          )}

        </div>

        {/* 说明文档 */}
        <div className="mt-8 bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6">
          <h3 className="text-white font-bold mb-3 flex items-center gap-2">
            <span className="text-xl">📖</span>
            使用说明
          </h3>
          <ul className="space-y-2 text-slate-300 text-sm">
            <li>• 自动将 <code className="bg-white/10 px-2 py-1 rounded">aesthetic-assets.oss-cn-hongkong.aliyuncs.com</code> 替换为 <code className="bg-white/10 px-2 py-1 rounded">assets.aestheticenglish.com</code></li>
            <li>• 自动处理中文文件名编码，确保链接可以直接在浏览器打开</li>
            <li>• 支持批量转换，每行一个链接</li>
            <li>• 转换后可一键复制所有链接</li>
          </ul>
        </div>

      </div>
    </div>
  );
}

