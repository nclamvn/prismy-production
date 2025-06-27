/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ultra-minimal config for maximum compatibility
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // Remove all potentially conflicting configurations
  compress: false,
  poweredByHeader: false,

  // Minimal webpack config - no fallbacks to avoid conflicts
  webpack: config => {
    return config
  },
}

module.exports = nextConfig
