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

  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  
  // CSS optimization (updated for latest Next.js)
  experimental: {
    optimizeCss: false, // Disable to avoid missing 'critters' dependency
  },

  // Headers configuration to fix manifest.json 401 error
  async headers() {
    return [
      // Manifest.json - permissive headers to prevent 401
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
          // Explicitly allow cross-origin access
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET',
          },
        ],
      },
      // Static assets - cache optimization
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Icons and other static files
      {
        source: '/icons/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Security headers for pages only (excluding static files)
      {
        source: '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|manifest.json|sitemap.xml|sw.js|icons/|assets/).*)' ,
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

  // Webpack optimizations to reduce CSS preload warnings
  webpack: (config, { dev, isServer }) => {
    // Optimize CSS extraction in production
    if (!dev && !isServer) {
      // Minimize CSS chunks to reduce preload warnings
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          styles: {
            name: 'styles',
            test: /\.(css|scss)$/,
            chunks: 'all',
            enforce: true,
            minSize: 0,
          },
        },
      }
    }
    
    return config
  },
}

module.exports = nextConfig
