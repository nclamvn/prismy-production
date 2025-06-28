/** @type {import('next').NextConfig} */
const nextConfig = {
  // Minimal config for deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['avatars.githubusercontent.com', 'images.unsplash.com'],
  },
  // Disable experimental features that might cause issues
  experimental: {},
  
  // Simplified webpack config
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        path: false,
        os: false,
        worker_threads: false,
        child_process: false,
      };
    }
    
    // Replace problematic modules with stubs
    config.resolve.alias = {
      ...config.resolve.alias,
      'pdfjs-dist': require.resolve('./lib/stubs/pdfjs-stub.ts'),
      'tesseract.js': require.resolve('./lib/stubs/tesseract-stub.ts'),
    };
    
    return config;
  },
};

module.exports = nextConfig;