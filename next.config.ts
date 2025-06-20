
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
  // Add allowedDevOrigins to address the cross-origin warning during development
  // Replace the example origin with the actual origin shown in your warning log if different.
  // The log showed: 6000-firebase-studio-1750097612873.cluster-l6vkdperq5ebaqo3qy4ksvoqom.cloudworkstations.dev
  // It's usually the host part of the URL from which you access your dev server.
  experimental: {
    // If using Next.js 14 or older, it might be `experimental.allowedDevOrigins`.
    // For Next.js 15+, it might be directly `allowedDevOrigins`.
    // Given Next.js 15.3.3, let's try `allowedDevOrigins` directly first.
    // If that causes an error, we'll switch to `experimental.allowedDevOrigins`.
  },
  allowedDevOrigins: [
    // This value should be the origin from which your browser is making requests
    // during development (e.g., the Firebase Studio preview URL).
    // The error log mentioned: "6000-firebase-studio-1750097612873.cluster-l6vkdperq5ebaqo3qy4ksvoqom.cloudworkstations.dev"
    // The scheme (http or https) is important. Assuming https.
    'https://6000-firebase-studio-1750097612873.cluster-l6vkdperq5ebaqo3qy4ksvoqom.cloudworkstations.dev',
    // It might also be just the port if accessed via localhost from the preview iframe
    'http://localhost:6000', // IDX preview port
  ],
};

export default nextConfig;
