
const webpack = require('webpack');

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Add support for WebAssembly, needed by dependencies like farmhash-modern.
    config.experiments = { ...config.experiments, asyncWebAssembly: true, layers: true };

    // Apply this fix only to the client-side bundle.
    if (!isServer) {
      // 1. Standard polyfill for the 'process' module.
      config.resolve.fallback = {
        ...config.resolve.fallback,
        process: require.resolve('process/browser'),
      };

      // 2. Forcefully replace any import of 'node:process'. This is the most direct fix.
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /^node:process$/,
          require.resolve('process/browser')
        )
      );
    }
    
    return config;
  },
};

module.exports = nextConfig;
