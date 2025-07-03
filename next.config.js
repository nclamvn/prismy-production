/** @type {import('next').NextConfig} */

// ===================================
// PRISMY UNIFIED NEXT.JS CONFIGURATION
// Consolidated from 7 config files
// Phase 6.1: Production CSP Fix
// ===================================

// Import Sentry webpack plugin conditionally
const { withSentryConfig } = process.env.SENTRY_DSN
  ? require('@sentry/nextjs')
  : { withSentryConfig: config => config }

const nextConfig = {
  // ===== PRODUCTION OPTIMIZATIONS =====
  productionBrowserSourceMaps: false,
  compress: true,
  poweredByHeader: false,
  generateEtags: false,

  // ===== SERVERLESS CONFIGURATION =====
  serverExternalPackages: ['unpdf', 'pdf-parse', 'pdf2json', 'canvas'],

  // ===== EXPERIMENTAL FEATURES =====
  experimental: {
    // Package import optimizations for bundle size
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-toast',
      '@radix-ui/react-dialog',
      '@stripe/stripe-js',
      '@supabase/supabase-js',
      'mammoth',
      'exceljs',
      'recharts',
    ],

    // CSS optimization (disabled due to missing 'critters' dependency)
    optimizeCss: false,
  },

  // ===== COMPILER OPTIMIZATIONS =====
  compiler: {
    removeConsole: {
      exclude: ['error', 'warn', 'info'], // Keep important logs
    },
    // No styled-components - using pure Tailwind CSS
  },

  // ===== MODULARIZE IMPORTS =====
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{member}}',
      skipDefaultConversion: true,
    },
    recharts: {
      transform: 'recharts/lib/{{member}}',
      skipDefaultConversion: true,
    },
    '@radix-ui/react-dropdown-menu': {
      transform: '@radix-ui/react-dropdown-menu/dist/{{member}}',
      skipDefaultConversion: true,
    },
  },

  // ===== IMAGES OPTIMIZATION =====
  images: {
    domains: ['images.unsplash.com', 'prismy.in', 'www.prismy.in', 'lh3.googleusercontent.com'],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400, // 24 hours
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Optimize for OAuth avatar images and performance
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
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
      // Font pre-connect and DNS prefetch headers for performance
      {
        source: '/((?!api|_next/static|_next/image|icons).*)',
        headers: [
          {
            key: 'Link',
            value: '<https://rsms.me>; rel=preconnect; crossorigin, <https://fonts.gstatic.com>; rel=preconnect; crossorigin, <https://fonts.googleapis.com>; rel=preconnect, <https://accounts.google.com>; rel=dns-prefetch, <https://oauth2.googleapis.com>; rel=dns-prefetch'
          }
        ]
      },
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
      // Security headers for pages (excluding static files) - RELAXED CSP
      {
        source:
          '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|manifest.json|sitemap.xml|sw.js|icons/|assets/).*)',
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
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          // Relaxed CSP for Next.js compatibility
          {
            key: 'Content-Security-Policy',
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https:; font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com; connect-src 'self' https://*.supabase.co https://*.supabase.com wss://*.supabase.co; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';",
          },
        ],
      },
    ]
  },

  // ===== WEBPACK OPTIMIZATIONS =====
  webpack: (config, { dev, isServer }) => {
    // Production optimizations - DISABLED to prevent module resolution issues
    if (!dev && !isServer) {
      // Use Next.js default chunk splitting
      config.optimization.splitChunks = undefined
      
      // Disable all problematic optimizations
      config.optimization.usedExports = false
      config.optimization.sideEffects = false
      config.optimization.mangleExports = false
    }

    // Enhanced configuration for document processing libraries
    if (isServer) {
      // Externalize packages that work better as external dependencies in serverless
      config.externals = config.externals || []
      config.externals.push({
        canvas: 'canvas',
        sharp: 'sharp',
      })

      // Configure unpdf for serverless environment
      config.resolve.alias = {
        ...config.resolve.alias,
        'pdfjs-dist/build/pdf.worker.js': false,
      }
    }

    // Handle file extensions for document processing
    config.resolve.extensions = ['.wasm', '.mjs', ...config.resolve.extensions]

    // Configure module rules for binary files
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    })

    return config
  },

  // ===== REDIRECTS & REWRITES =====
  async redirects() {
    return [
      // Future redirects can be added here
    ]
  },
}

// Sentry configuration for error tracking
const sentryWebpackPluginOptions = {
  // Suppresses source map uploading logs during build
  silent: true,

  // Upload source maps to Sentry
  hideSourceMaps: true,

  // Disable source map generation in development
  disableLogger: true,

  // Upload source maps only in production
  dryRun: process.env.NODE_ENV !== 'production',

  // Sentry organization and project
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Auth token for uploading
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Release configuration
  release: {
    name:
      process.env.VERCEL_GIT_COMMIT_SHA || process.env.NEXT_PUBLIC_APP_VERSION,
    setCommits: {
      auto: true,
      ignoreMissing: true,
    },
  },

  // Webpack plugin options
  widenClientFileUpload: true,
  transpileClientSDK: true,
  tunnelRoute: '/monitoring',
  hideSourceMaps: true,
  disableLogger: true,
}

// Export configuration with or without Sentry
module.exports = process.env.SENTRY_DSN
  ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
  : nextConfig
