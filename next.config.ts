import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "aesthetic-assets.oss-cn-hongkong.aliyuncs.com",
      },
    ],
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
