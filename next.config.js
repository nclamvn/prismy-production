/** @type {import('next').NextConfig} */
const nextConfig = {
  // Simplified config for stable deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // Basic image optimization
  images: {
    formats: ['image/webp'],
    minimumCacheTTL: 3600,
  },

  // Basic compression
  compress: true,
  poweredByHeader: false,

  // Simple webpack config - remove complex optimizations
  webpack: (config, { _dev, isServer }) => {
    // Only basic fallbacks
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      }
    }

    return config
  },

  // Simple headers
  async headers() {
    return [
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
