import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
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
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 2592000,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb'
    },
    optimizePackageImports: ['framer-motion', 'lucide-react'],
  },
  serverExternalPackages: ['ali-oss', 'proxy-agent'],
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
// Force redeploy: Sun Feb 22 14:50:36 CST 2026
// Force redeploy: Mon Feb 23 17:18:01 CST 2026
// Force redeploy: Mon Feb 23 17:48:11 CST 2026
// Force redeploy: Tue Feb 24 00:42:30 CST 2026
// Force redeploy: Tue Feb 24 01:51:38 CST 2026
// Force redeploy: Tue Feb 24 10:43:48 CST 2026
// Force redeploy: Wed Feb 25 01:36:15 CST 2026
// Force redeploy: Wed Feb 25 14:21:15 CST 2026
// Force redeploy: Wed Feb 25 14:40:56 CST 2026
// Force redeploy: Wed Feb 25 21:21:28 CST 2026
// Force redeploy: Wed Feb 25 21:46:26 CST 2026
// Force redeploy: Wed Feb 25 22:13:28 CST 2026
// Force redeploy: Wed Feb 25 22:19:43 CST 2026
// Force redeploy: Wed Feb 25 23:31:35 CST 2026
// Force redeploy: Thu Feb 26 02:08:08 CST 2026
// Force redeploy: Thu Feb 26 21:09:33 CST 2026
