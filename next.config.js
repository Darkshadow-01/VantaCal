/** @type {import('next').NextConfig} */
const nextConfig = {
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    minimumCacheTTL: 60,
  },

  // Enable React Compiler for automatic performance optimizations
  reactCompiler: true,

  // Bundle analysis and optimization
  webpack: (config, { isServer }) => {
    config.optimization.usedExports = true;
    return config;
  },

  // Headers for caching and performance
  async headers() {
    return [
      {
        source: '/images/:path*',
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

  // Disable unused CSS
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Optimized production builds
  productionBrowserSourceMaps: false,
  swcMinify: true,
  poweredByHeader: false,

  // Font optimization
  optimizeFonts: true,

  // Experimental features
  experimental: {
    optimizePackageImports: ['@radix-ui/react-icons'],
  },
};

module.exports = nextConfig;
