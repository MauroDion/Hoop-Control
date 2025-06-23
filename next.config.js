
const webpack = require('webpack');

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Add support for WebAssembly, needed by dependencies like farmhash-modern.
    config.experiments = { ...config.experiments, asyncWebAssembly: true, layers: true };

    // Apply this fix only to the client-side bundle.
    if (!isServer) {
      // Standard polyfill for the 'process' module.
      config.resolve.fallback = {
        ...config.resolve.fallback,
        process: require.resolve('process/browser'),
      };
      
      // Use the NormalModuleReplacementPlugin to forcefully replace any
      // import of 'node:process' with its browser-compatible substitute.
      // This is more powerful than a simple alias.
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /^node:process$/, // Match the exact module name.
          (resource) => {
            resource.request = 'process/browser';
          }
        )
      );
    }
    
    return config;
  },
};

module.exports = nextConfig;
