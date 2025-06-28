/** @type {import('next').NextConfig} */

// ===================================
// PRISMY UNIFIED NEXT.JS CONFIGURATION
// Consolidated from 7 config files
// Phase 0.1: Foundation Cleanup
// ===================================

const nextConfig = {
  // ===== PRODUCTION OPTIMIZATIONS =====
  productionBrowserSourceMaps: false,
  optimizeFonts: true,
  compress: true,
  poweredByHeader: false,
  generateEtags: false,

  // ===== EXPERIMENTAL FEATURES =====
  experimental: {
    // Package import optimizations for bundle size
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-toast',
      '@radix-ui/react-dialog',
      '@stripe/stripe-js',
      '@supabase/supabase-js',
      'mammoth',
      'exceljs',
    ],
    
    // Server-side externals for heavy packages
    serverExternalPackages: [
      'tesseract.js',
      'pdf-parse',
      'sharp',
      'canvas',
      'jimp'
    ],

    // Turbo mode optimizations
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },

    // CSS optimization (disabled due to missing 'critters' dependency)
    optimizeCss: false,
  },

  // ===== COMPILER OPTIMIZATIONS =====
  compiler: {
    removeConsole: {
      exclude: ['error', 'warn', 'info'] // Keep important logs
    },
    styledComponents: false, // We use Tailwind
  },

  // ===== IMAGES OPTIMIZATION =====
  images: {
    domains: ['images.unsplash.com', 'prismy.in', 'www.prismy.in'],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400, // 24 hours
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // ===== BUILD OPTIMIZATION =====
  eslint: {
    ignoreDuringBuilds: true, // Lint in CI/CD pipeline instead
  },
  typescript: {
    ignoreBuildErrors: true, // Type check in CI/CD pipeline instead
  },

  // ===== HEADERS CONFIGURATION =====
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
      // Static assets - aggressive caching
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Icons and assets
      {
        source: '/icons/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Security headers for pages (excluding static files)
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

  // ===== WEBPACK OPTIMIZATIONS =====
  webpack: (config, { dev, isServer }) => {
    // CSS optimization for production
    if (!dev && !isServer) {
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

  // ===== REDIRECTS & REWRITES =====
  async redirects() {
    return [
      // Future redirects can be added here
    ]
  },
}

module.exports = nextConfig