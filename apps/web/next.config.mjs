/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@kindstyle/shared', '@kindstyle/database'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.fortnite-api.com',
      },
      {
        protocol: 'https',
        hostname: '**.epicgames.com',
      },
    ],
  },
}

export default nextConfig
