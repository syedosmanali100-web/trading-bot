/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Speed optimizations for development
  experimental: {
    // Enable faster refresh
    optimizePackageImports: ['@radix-ui/react-icons'],
  },
  // Reduce build time
  swcMinify: true,
  // Faster page loads
  compress: true,
}

export default nextConfig
