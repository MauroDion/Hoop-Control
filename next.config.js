
const webpack = require('webpack');

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
    // Add fallback for 'process' module for browser builds. This handles 'import process from "process"'.
    if (!isServer) {
        config.resolve.fallback = {
            ...config.resolve.fallback,
            process: require.resolve('process/browser'),
        };
    }

    // Enable WebAssembly experiments
    config.experiments = { ...config.experiments, asyncWebAssembly: true, topLevelAwait: true };
    
    // Handle .wasm files
    config.module.rules.push({
      test: /\.wasm$/,
      type: "webassembly/async",
    });

    // Add ProvidePlugin to make 'process' available globally. This is for code that expects a global `process` variable.
    config.plugins.push(
      new webpack.ProvidePlugin({
        process: 'process/browser',
      })
    );

    return config;
  },
};

module.exports = nextConfig;
