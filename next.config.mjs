import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  output: 'standalone', // Optimizes for production deployment
  poweredByHeader: false, // Removes X-Powered-By header for security
  webpack: (config) => {
    config.resolve.alias['@'] = __dirname
    return config
  },
}

export default nextConfig
