/** @type {import('next').NextConfig} */
const nextConfig = {
  // ===== PRODUCTION OPTIMIZATION =====
  productionBrowserSourceMaps: false,
  optimizeFonts: true,
  compress: true,
  poweredByHeader: false,

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
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },

  // ===== COMPILER OPTIMIZATIONS =====
  compiler: {
    removeConsole: {
      exclude: ['error', 'warn']
    },
    styledComponents: false,
  },

  // ===== IMAGES OPTIMIZATION =====
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    domains: [
      'prismy.in',
      'cdn.prismy.in',
      'assets.prismy.in',
      'images.unsplash.com',
      'source.unsplash.com'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.prismy.in',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      }
    ]
  },

  // ===== HEADERS CONFIGURATION =====
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate'
          }
        ]
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/icons/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ]
  },

  // ===== REDIRECTS =====
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/dashboard',
        permanent: true
      },
      {
        source: '/login',
        destination: '/dashboard',
        permanent: false
      },
      {
        source: '/signup',
        destination: '/dashboard',
        permanent: false
      }
    ]
  },

  // ===== WEBPACK OPTIMIZATION =====
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Production client-side optimizations
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            framework: {
              chunks: 'all',
              name: 'framework',
              test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
              priority: 40,
              enforce: true,
            },
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
            commons: {
              name: 'commons',
              minChunks: 2,
              priority: 20,
            },
            shared: {
              name: 'shared',
              chunks: 'all',
              test: /[\\/]node_modules[\\/]/,
              priority: 10,
              enforce: true,
            },
          },
        },
      }
    }

    // Bundle analyzer (only in production)
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

    // SVG handling
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack']
    })

    return config
  },

  // ===== ENVIRONMENT VARIABLES =====
  env: {
    CUSTOM_KEY: 'prismy-production',
    BUILD_TIME: new Date().toISOString(),
  },

  // ===== OUTPUT CONFIGURATION =====
  output: 'standalone',
  distDir: '.next',
  generateEtags: false,
  
  // ===== TYPESCRIPT & ESLINT =====
  typescript: {
    // Skip type checking during production build for faster deployment
    ignoreBuildErrors: true,
  },
  eslint: {
    // Skip ESLint during production build for faster deployment
    ignoreDuringBuilds: true,
  },

  // ===== PWA CONFIGURATION =====
  // Note: This would require next-pwa plugin
  // pwa: {
  //   dest: 'public',
  //   register: true,
  //   skipWaiting: true,
  //   runtimeCaching: [
  //     {
  //       urlPattern: /^https?.*/,
  //       handler: 'NetworkFirst',
  //       options: {
  //         cacheName: 'offlineCache',
  //         expiration: {
  //           maxEntries: 200,
  //         },
  //       },
  //     },
  //   ],
  // },

  // ===== LOGGING =====
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
}

module.exports = nextConfig