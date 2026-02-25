"use client";

import HLSVideoPlayer from "@/components/HLSVideoPlayer";

export default function TestHLSPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* 标题 */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            🚀 HLS 播放器测试
          </h1>
          <p className="text-xl text-purple-200">
            大厂级视频播放体验 - 对标字节跳动/B站
          </p>
        </div>

        {/* 测试 1：HLS 流（自适应码率） */}
        <div className="mb-12 bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
            <h2 className="text-2xl font-bold text-white">
              测试 1：HLS 自适应码率播放
            </h2>
          </div>
          
          <div className="mb-4">
            <HLSVideoPlayer
              videoUrl="https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
              autoplay={false}
            />
          </div>

          <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
            <p className="text-green-200 text-sm">
              ✅ <strong>预期效果：</strong>
            </p>
            <ul className="text-green-200 text-sm mt-2 space-y-1 ml-4">
              <li>• 右下角显示绿色 "HLS" 标识</li>
              <li>• 点击设置图标可切换画质（自动、1080P、720P、360P）</li>
              <li>• 首帧加载时间 &lt; 1 秒</li>
              <li>• 拖动进度条响应迅速</li>
            </ul>
          </div>
        </div>

        {/* 测试 2：MP4 降级播放 */}
        <div className="mb-12 bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
            <h2 className="text-2xl font-bold text-white">
              测试 2：MP4 自动降级播放
            </h2>
          </div>
          
          <div className="mb-4">
            <HLSVideoPlayer
              videoUrl="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
              autoplay={false}
            />
          </div>

          <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-yellow-200 text-sm">
              ✅ <strong>预期效果：</strong>
            </p>
            <ul className="text-yellow-200 text-sm mt-2 space-y-1 ml-4">
              <li>• 右下角<strong>不显示</strong> "HLS" 标识（因为是 MP4）</li>
              <li>• 视频正常播放（自动降级到原生播放器）</li>
              <li>• 控制栏功能完整（播放、暂停、进度条、静音）</li>
            </ul>
          </div>
        </div>

        {/* 功能说明 */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6">
            🎯 核心功能验证清单
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-purple-300">基础功能</h3>
              <ul className="space-y-2 text-white/80 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>播放/暂停按钮</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>进度条拖动</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>静音/取消静音</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>时间显示（当前/总时长）</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-purple-300">高级功能</h3>
              <ul className="space-y-2 text-white/80 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>HLS 自适应码率</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>画质手动切换</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>缓冲进度显示</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>MP4 自动降级</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* 下一步提示 */}
        <div className="mt-12 text-center">
          <div className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-white mb-4">
              ✅ 测试通过？下一步行动
            </h3>
            <div className="text-white/90 space-y-2 text-left max-w-2xl">
              <p>1. 转码你的第一个视频：<code className="bg-black/30 px-2 py-1 rounded">./scripts/convert-to-hls.sh</code></p>
              <p>2. 上传到阿里云 OSS 并配置 CORS</p>
              <p>3. 在你的课程页面中集成 HLSVideoPlayer</p>
              <p>4. 配置 CDN 加速（可选但推荐）</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

