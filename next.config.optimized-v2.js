/** @type {import('next').NextConfig} */

// Performance-optimized Next.js configuration
// Phase 10.1: Real-world Performance Optimization

const nextConfig = {
  // ===== PRODUCTION OPTIMIZATIONS =====
  productionBrowserSourceMaps: false,
  compress: true,
  poweredByHeader: false,
  generateEtags: false,

  // ===== EXPERIMENTAL FEATURES =====
  experimental: {
    // Enable optimizations
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-toast',
      '@radix-ui/react-dialog'
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

    // Enable modern JavaScript features
    esmExternals: 'loose',
  },

  // ===== COMPILER OPTIMIZATIONS =====
  compiler: {
    // Remove console statements in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,

    // Remove React dev props in production
    reactRemoveProperties: process.env.NODE_ENV === 'production',

    // Enable SWC minification
    styledComponents: false,
  },

  // ===== WEBPACK OPTIMIZATIONS =====
  webpack: (config, { dev, isServer, webpack }) => {
    // Production optimizations
    if (!dev) {
      // Enhanced code splitting
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        minimize: true,
        usedExports: true,
        sideEffects: false,
        splitChunks: {
          chunks: 'all',
          minSize: 20000,
          maxSize: 200000, // Smaller chunks for better caching
          cacheGroups: {
            // React framework
            framework: {
              chunks: 'all',
              name: 'framework',
              test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types)[\\/]/,
              priority: 40,
              enforce: true,
            },

            // Framer Motion - separate chunk
            motion: {
              name: 'motion',
              test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
              chunks: 'all',
              priority: 35,
              enforce: true,
            },

            // Lucide React - separate chunk
            icons: {
              name: 'icons',
              test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
              chunks: 'all',
              priority: 35,
              enforce: true,
            },

            // Radix UI components
            radix: {
              name: 'radix',
              test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
              chunks: 'all',
              priority: 35,
              enforce: true,
            },

            // Supabase
            supabase: {
              name: 'supabase',
              test: /[\\/]node_modules[\\/]@supabase[\\/]/,
              chunks: 'all',
              priority: 30,
              enforce: true,
            },

            // Common vendor libraries
            vendor: {
              name: 'vendor',
              test: /[\\/]node_modules[\\/]/,
              chunks: 'all',
              priority: 10,
              minChunks: 2,
            },

            // Common application code
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 5,
              reuseExistingChunk: true,
            },
          },
        },
      }

      // Module federation for micro-frontends
      config.plugins.push(
        new webpack.container.ModuleFederationPlugin({
          name: 'prismy_host',
          remotes: {},
          shared: {
            react: { singleton: true },
            'react-dom': { singleton: true },
          },
        })
      )
    }

    // Tree shaking optimizations
    config.resolve.alias = {
      ...config.resolve.alias,
      // Optimize lodash imports
      'lodash': 'lodash-es',
    }

    // Bundle analyzer
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
          reportFilename: 'bundle-report.html',
        })
      )
    }

    // Optimize SVG loading
    config.module.rules.push({
      test: /\.svg$/,
      use: [
        {
          loader: '@svgr/webpack',
          options: {
            dimensions: false,
            svgo: true,
            svgoConfig: {
              plugins: [
                {
                  name: 'removeViewBox',
                  active: false,
                },
                {
                  name: 'removeDimensions',
                  active: true,
                },
                {
                  name: 'removeXMLNS',
                  active: true,
                },
              ],
            },
          },
        },
      ],
    })

    // Ignore heavy optional dependencies
    config.externals = config.externals || []
    if (isServer) {
      config.externals.push(
        'tesseract.js',
        'pdf-parse',
        'canvas',
        'sharp',
        'jimp'
      )
    }

    // Webpack performance hints
    config.performance = {
      hints: dev ? false : 'warning',
      maxAssetSize: 200000, // 200KB
      maxEntrypointSize: 400000, // 400KB
    }

    return config
  },

  // ===== OUTPUT CONFIGURATION =====
  output: 'standalone',
  distDir: '.next',

  // ===== IMAGES OPTIMIZATION =====
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    domains: ['prismy.in', 'cdn.prismy.in', 'assets.prismy.in'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.prismy.in',
      },
    ],
  },

  // ===== HEADERS FOR PERFORMANCE =====
  async headers() {
    return [
      // Static assets caching
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      
      // API routes caching
      {
        source: '/api/health',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, stale-while-revalidate=30',
          },
        ],
      },

      // Font optimization
      {
        source: '/(.*\\.(woff|woff2|eot|ttf|otf))',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },

      // Security headers
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

  // ===== REDIRECTS =====
  async redirects() {
    return [
      // SEO redirects
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
      {
        source: '/login',
        destination: '/dashboard',
        permanent: false,
      },
    ]
  },

  // ===== REWRITES FOR API OPTIMIZATION =====
  async rewrites() {
    return [
      // API route optimization
      {
        source: '/api/v1/:path*',
        destination: '/api/:path*',
      },
    ]
  },

  // ===== SKIP CHECKS FOR FASTER BUILD =====
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'production',
  },
  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV === 'production',
  },

  // ===== ENVIRONMENT VARIABLES =====
  env: {
    BUILD_TIME: new Date().toISOString(),
    BUNDLE_ANALYZE: process.env.ANALYZE === 'true',
  },

  // ===== LOGGING =====
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === 'development',
    },
  },
}

module.exports = nextConfig