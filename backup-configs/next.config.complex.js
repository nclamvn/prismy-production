/** @type {import('next').NextConfig} */
const nextConfig = {
  // Minimal config for stable deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    optimizePackageImports: [
      'framer-motion',
      '@stripe/stripe-js',
      '@supabase/supabase-js',
      'mammoth',
      'exceljs',
    ],
  },

  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 86400, // 24 hours
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Compression
  compress: true,

  // Enable static optimization (removed swcMinify for Next.js 15)

  // Performance monitoring
  poweredByHeader: false,

  // Security headers are handled in middleware.ts

  // Progressive Web App
  generateBuildId: async () => {
    return `prismy-${Date.now()}`
  },

  // Bundle analysis
  webpack: (config, { _buildId, dev, isServer, _defaultLoaders, webpack }) => {
    // CRITICAL: Replace problematic modules with stubs in production
    if (!dev) {
      // Use stub modules instead of real ones
      config.resolve.alias = {
        ...config.resolve.alias,
        'pdfjs-dist': require.resolve('./lib/stubs/pdfjs-stub.ts'),
      }

      // Exclude worker threads and problematic modules
      config.externals = config.externals || []
      if (isServer) {
        config.externals.push({
          worker_threads: 'commonjs worker_threads',
          child_process: 'commonjs child_process',
        })
      }

      // Ignore worker imports completely
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /\.worker\.js$/,
        }),
        new webpack.IgnorePlugin({
          resourceRegExp: /worker_threads/,
        }),
        new webpack.NormalModuleReplacementPlugin(
          /pdfjs-dist\/build\/pdf\.worker\.min\.js/,
          require.resolve('./lib/stubs/pdfjs-stub.ts')
        )
      )
    }

    // Bundle analysis in development
    if (dev && process.env.BUNDLE_ANALYZE) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const BundleAnalyzerPlugin =
        require('webpack-bundle-analyzer').BundleAnalyzerPlugin
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'server',
          analyzerPort: isServer ? 8888 : 8889,
          openAnalyzer: true,
        })
      )
    }

    // Optimize fallbacks for serverless
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        worker_threads: false,
        child_process: false,
      }
    } else {
      // Server-side fallbacks for serverless
      config.resolve.fallback = {
        ...config.resolve.fallback,
        worker_threads: false,
      }
    }

    // Optimize chunk splitting
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          exceljs: {
            name: 'exceljs',
            test: /[\\/]node_modules[\\/]exceljs[\\/]/,
            chunks: 'all',
            priority: 10,
          },
          framerMotion: {
            name: 'framer-motion',
            test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
            chunks: 'all',
            priority: 10,
          },
          supabase: {
            name: 'supabase',
            test: /[\\/]node_modules[\\/]@supabase[\\/]/,
            chunks: 'all',
            priority: 10,
          },
          ai: {
            name: 'ai-providers',
            test: /[\\/]node_modules[\\/](@anthropic-ai|openai|cohere-ai)[\\/]/,
            chunks: 'all',
            priority: 15,
          },
          ui: {
            name: 'ui-components',
            test: /[\\/]node_modules[\\/](lucide-react|framer-motion)[\\/]/,
            chunks: 'all',
            priority: 12,
          },
          vendor: {
            name: 'vendor',
            test: /[\\/]node_modules[\\/]/,
            chunks: 'all',
            priority: 5,
            maxSize: 200000, // 200kb chunks
            enforce: true,
          },
        },
      }
    }

    return config
  },

  // Headers for performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/icons/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
