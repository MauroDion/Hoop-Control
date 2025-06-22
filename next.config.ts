
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
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
  // This value should be the origin from which your browser is making requests
  // during development (e.g., the Firebase Studio preview URL).
  allowedDevOrigins: [
    'https://9000-firebase-studio-1750097612873.cluster-l6vkdperq5ebaqo3qy4ksvoqom.cloudworkstations.dev',
    'http://localhost:6000', // IDX preview port
  ],
};

export default nextConfig;
