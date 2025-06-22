/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
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
    // This value should be the origin from which your browser is making requests
    // during development (e.g., the Firebase Studio preview URL).
    allowedDevOrigins: [
      'https://9000-firebase-studio-1750097612873.cluster-l6vkdperq5ebaqo3qy4ksvoqom.cloudworkstations.dev',
      'https://6000-firebase-studio-1750097612873.cluster-l6vkdperq5ebaqo3qy4ksvoqom.cloudworkstations.dev',
      'http://localhost:6000', // IDX preview port
    ],
  }
};

module.exports = nextConfig;
