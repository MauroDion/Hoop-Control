
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
    // Apply this configuration only to the client-side bundle.
    if (!isServer) {
      // This plugin is a targeted fix for the "node:process" error.
      // It directly replaces any import of 'node:process' with its browser-safe equivalent.
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /^node:process$/, // Match 'node:process' exactly.
          (resource) => {
            resource.request = require.resolve('process/browser');
          }
        )
      );

      // This provides a fallback for any other module that might just import 'process'.
      config.resolve.fallback = {
        ...config.resolve.fallback,
        process: require.resolve('process/browser'),
      };
    }

    // Keep the WebAssembly config as it's unrelated and likely necessary for other dependencies.
    config.experiments = { ...config.experiments, asyncWebAssembly: true, topLevelAwait: true };
    config.module.rules.push({
      test: /\.wasm$/,
      type: "webassembly/async",
    });

    return config;
  },
};

module.exports = nextConfig;
