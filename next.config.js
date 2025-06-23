
const webpack = require('webpack');

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Add this line to enable WebAssembly support
    config.experiments = { ...config.experiments, asyncWebAssembly: true };

    // Handles 'node:process' imports in the browser.
    config.resolve.alias = {
      ...config.resolve.alias,
      'node:process': 'process/browser',
    };
    
    // Makes 'process' globally available in the browser, which some libraries expect.
    config.plugins.push(
      new webpack.ProvidePlugin({
        process: 'process/browser',
      })
    );
    
    return config;
  },
};

module.exports = nextConfig;
