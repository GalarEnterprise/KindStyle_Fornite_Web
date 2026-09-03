/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@kindstyle/shared', '@kindstyle/database'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fortnite-api.com',
      },
      {
        protocol: 'https',
        hostname: '**.fortnite-api.com',
      },
      {
        protocol: 'https',
        hostname: 'epicgames.com',
      },
      {
        protocol: 'https',
        hostname: '**.epicgames.com',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/account',
        destination: '/account/profile',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
