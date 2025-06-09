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
}

export default nextConfig
