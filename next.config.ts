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
  // 解决 macOS 权限问题
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // 告诉 Next.js 这些包是服务端专用的，不要在客户端打包
  serverExternalPackages: ['ali-oss', 'proxy-agent'],
};

export default nextConfig;
