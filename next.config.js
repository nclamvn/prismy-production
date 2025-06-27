/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ultra-minimal config for maximum compatibility
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // Image optimization configuration
  images: {
    domains: ['images.unsplash.com', 'prismy.in', 'www.prismy.in'],
    formats: ['image/webp'],
    minimumCacheTTL: 86400,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Remove all potentially conflicting configurations
  compress: false,
  poweredByHeader: false,

  // Minimal webpack config - no fallbacks to avoid conflicts
  webpack: config => {
    return config
  },
}

module.exports = nextConfig
