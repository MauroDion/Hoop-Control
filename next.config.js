
const webpack = require('webpack');

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // This is required by a dependency (likely Firebase)
    config.experiments = { ...config.experiments, asyncWebAssembly: true };

    // This block applies a comprehensive, three-part fix for the "node:process" error,
    // ensuring it only runs for the client-side bundle.
    if (!isServer) {
      // 1. Add a fallback for the 'process' module.
      config.resolve.fallback = {
        ...config.resolve.fallback,
        process: require.resolve('process/browser'),
      };

      // 2. Alias 'node:process' to the browser-safe replacement.
      config.resolve.alias['node:process'] = 'process/browser';

      // 3. Provide the 'process' variable globally.
      config.plugins.push(
        new webpack.ProvidePlugin({
          process: 'process/browser',
        })
      );
    }

    return config;
  },
};

module.exports = nextConfig;
