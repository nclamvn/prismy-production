/** @type {import('next').NextConfig} */

// Performance-optimized Next.js configuration for maximum speed
const nextConfig = {
  // Build optimizations - Warning only mode
  eslint: {
    ignoreDuringBuilds: true,
    dirs: ['app', 'components', 'lib', 'contexts', 'hooks'],
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // Advanced image optimization with next-gen formats
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000, // 1 year cache
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    domains: [],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Performance optimizations
  compress: true,
  poweredByHeader: false,

  // Bundle optimization - minimal for stability
  experimental: {
    // optimizeCss: true, // Disabled due to critters dependency issue
    missingSuspenseWithCSRBailout: false,
  },

  // Skip trailing slash redirects
  skipTrailingSlashRedirect: true,

  // Dynamic build ID for proper cache invalidation
  generateBuildId: async () => {
    return `build-${Date.now()}`
  },

  // Simplified webpack optimizations for stability
  webpack: (config, { dev, isServer }) => {
    // Client-side fallbacks
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        buffer: false,
      }
    }

    // Basic bundle optimization
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: false,
      }
    }

    return config
  },

  // Comprehensive performance headers
  async headers() {
    return [
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value:
              'public, max-age=300, s-maxage=300, stale-while-revalidate=60',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },

  // Optimize redirects and rewrites
  async redirects() {
    return []
  },

  async rewrites() {
    return []
  },
}

module.exports = nextConfig
