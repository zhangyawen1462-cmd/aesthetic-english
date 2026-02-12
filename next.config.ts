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
};

export default nextConfig;
