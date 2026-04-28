/** @type {import('next').NextConfig} */
const nextConfig = {
  // ── Performance: Enable production-grade compression ──
  compress: true,

  // ── Performance: Optimize builds ──
  reactStrictMode: false, // Avoid double-renders in dev
  poweredByHeader: false, // Remove X-Powered-By header

  async rewrites() {
    return [
      {
        source: '/media/:path*',
        destination: 'http://localhost:8000/media/:path*',
      },
    ]
  },

  // ── Performance: Optimize bundle splitting ──
  experimental: {
    optimizePackageImports: ['lucide-react', 'xlsx'],
  },
}
module.exports = nextConfig
