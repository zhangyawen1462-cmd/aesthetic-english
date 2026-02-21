/** @type {import('next').NextConfig} */
const nextConfig = {
  // 🚀 性能优化配置
  
  // 1. 图片优化
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1年缓存
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // 2. 编译优化
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // 3. 实验性功能：优化包大小
  experimental: {
    optimizePackageImports: [
      'framer-motion',
      'lucide-react',
      '@notionhq/client',
    ],
  },

  // 4. 压缩和优化
  compress: true,
  poweredByHeader: false,
  
  // 5. 生产环境优化
  productionBrowserSourceMaps: false,
  
  // 6. SWC 最小化配置
  swcMinify: true,

  // 7. 静态资源优化
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|jpeg|png|gif|webp|avif|woff|woff2)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

