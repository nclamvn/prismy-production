/** @type {import('next').NextConfig} */
const nextConfig = {
  // ===== AGGRESSIVE PRODUCTION OPTIMIZATION =====
  productionBrowserSourceMaps: false,
  optimizeFonts: true,
  compress: true,
  poweredByHeader: false,
  swcMinify: true,

  // ===== PERFORMANCE CONFIGURATION =====
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-toast',
      '@radix-ui/react-dialog'
    ],
    // Enable aggressive optimizations
    serverComponentsExternalPackages: [
      'tesseract.js',
      'pdf-parse',
      'sharp',
      'canvas'
    ],
  },

  // ===== COMPILER OPTIMIZATIONS =====
  compiler: {
    removeConsole: {
      exclude: ['error', 'warn']
    },
    // Remove development helpers
    reactRemoveProperties: process.env.NODE_ENV === 'production',
  },

  // ===== WEBPACK OPTIMIZATION =====
  webpack: (config, { dev, isServer }) => {
    if (!dev) {
      // Production optimizations
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        minimize: true,
        usedExports: true,
        sideEffects: false,
        splitChunks: {
          chunks: 'all',
          minSize: 20000,
          maxSize: 244000,
          cacheGroups: {
            default: false,
            vendors: false,
            // Framework chunk
            framework: {
              chunks: 'all',
              name: 'framework',
              test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types)[\\/]/,
              priority: 40,
              enforce: true,
            },
            // Large libraries
            lib: {
              test(module) {
                return module.size() > 160000 && /node_modules[/\\]/.test(module.identifier())
              },
              name(module) {
                const hash = require('crypto').createHash('sha1')
                hash.update(module.identifier())
                return hash.digest('hex').substring(0, 8)
              },
              priority: 30,
              minChunks: 1,
              reuseExistingChunk: true,
            },
            // Specific vendor chunks
            motion: {
              name: 'motion',
              test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
              priority: 35,
              enforce: true,
            },
            icons: {
              name: 'icons',
              test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
              priority: 35,
              enforce: true,
            },
            ui: {
              name: 'ui',
              test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
              priority: 35,
              enforce: true,
            },
            // Common chunks
            commons: {
              name: 'commons',
              minChunks: 2,
              priority: 20,
              reuseExistingChunk: true,
            },
            // Default vendor chunk
            default: {
              name: 'default',
              test: /[\\/]node_modules[\\/]/,
              priority: 10,
              reuseExistingChunk: true,
            },
          },
        },
      }

      // Tree shaking for specific packages
      config.resolve.alias = {
        ...config.resolve.alias,
        // Use specific lucide imports
        'lucide-react': 'lucide-react/dist/esm/icons',
      }
    }

    // External dependencies for server
    if (isServer) {
      config.externals = [
        ...config.externals,
        'tesseract.js',
        'pdf-parse',
        'canvas',
        'sharp'
      ]
    }

    // Bundle analyzer for optimization
    if (!dev && process.env.ANALYZE) {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
          reportFilename: './bundle-analyzer-report.html'
        })
      )
    }

    // SVG optimization
    config.module.rules.push({
      test: /\.svg$/,
      use: [
        {
          loader: '@svgr/webpack',
          options: {
            dimensions: false,
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
              ],
            },
          },
        },
      ],
    })

    return config
  },

  // ===== OUTPUT OPTIMIZATION =====
  output: 'standalone',
  distDir: '.next',
  generateEtags: false,
  
  // ===== IMAGES OPTIMIZATION =====
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    domains: ['prismy.in', 'cdn.prismy.in'],
  },

  // ===== SKIP CHECKS FOR FASTER BUILD =====
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // ===== HEADERS FOR PERFORMANCE =====
  async headers() {
    return [
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, stale-while-revalidate=60'
          }
        ]
      }
    ]
  },
}

module.exports = nextConfig