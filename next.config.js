
const webpack = require('webpack');

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    config.experiments = { ...config.experiments, asyncWebAssembly: true };

    // The following configuration is only needed for the client-side bundle.
    if (!isServer) {
      // Add a fallback for the 'process' module.
      // This tells webpack to use 'process/browser' when it encounters 'process'.
      config.resolve.fallback = {
        ...config.resolve.fallback,
        process: require.resolve('process/browser'),
      };

      // Add an alias for the specific 'node:process' import.
      // This directly targets the error message you're seeing.
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
    }
    
    return config;
  },
};

module.exports = nextConfig;
