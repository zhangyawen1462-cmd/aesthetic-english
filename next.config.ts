import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // 🚨 核心修复：给所有图片域名发放"白名单通行证"
    remotePatterns: [
      {
        protocol: "https",
        hostname: "aesthetic-assets.oss-cn-hongkong.aliyuncs.com",
      },
      {
        protocol: "https",
        hostname: "assets.aestheticenglish.com",
      },
    ],
    // 🚀 图片优化配置
    formats: ['image/avif', 'image/webp'], // 优先使用现代格式（体积减少 30-50%）
    deviceSizes: [640, 750, 828, 1080, 1200, 1920], // 响应式断点
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384], // 小图尺寸
    minimumCacheTTL: 2592000, // 缓存 30 天
  },
  // 移除文件大小限制，支持任意大小的字幕和视频文件
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
  // 告诉 Next.js 这些包是服务端专用的，不要在客户端打包
  serverExternalPackages: ['ali-oss', 'proxy-agent'],
};

export default nextConfig;
// Force redeploy: Sun Feb 22 01:05:28 CST 2026
// Force redeploy: Sun Feb 22 01:15:21 CST 2026
// Force redeploy: Sun Feb 22 01:43:20 CST 2026
