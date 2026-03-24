/** @type {import('next').NextConfig} */
const nextConfig = {
  // Silence the Turbopack warning
  turbopack: {},

  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [{ protocol: "https", hostname: "**" }],
    minimumCacheTTL: 60,
  },

  poweredByHeader: false,
};

module.exports = nextConfig;
