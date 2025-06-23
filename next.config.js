
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
  webpack: (config, { isServer }) => {
    // This is the essential fix for the "node:process" error.
    // It tells Webpack to use a browser-compatible version of the 'process' module for client-side code.
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        process: require.resolve('process/browser'),
      };
    }

    // Keep the WebAssembly config as it's unrelated and likely necessary.
    config.experiments = { ...config.experiments, asyncWebAssembly: true, topLevelAwait: true };
    config.module.rules.push({
      test: /\.wasm$/,
      type: "webassembly/async",
    });

    return config;
  },
};

module.exports = nextConfig;
