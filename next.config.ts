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
