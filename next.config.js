/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    // This is the correct location for this experimental flag in Next.js 14
    allowedDevOrigins: [
      'https://9000-firebase-studio-1750097612873.cluster-l6vkdperq5ebaqo3qy4ksvoqom.cloudworkstations.dev',
      'https://6000-firebase-studio-1750097612873.cluster-l6vkdperq5ebaqo3qy4ksvoqom.cloudworkstations.dev',
      'http://localhost:6000',
    ],
  }
};

module.exports = nextConfig;
