
const webpack = require('webpack');

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // This is required by a dependency (likely Firebase)
    config.experiments = { ...config.experiments, asyncWebAssembly: true };

    // For client-side code, we provide a comprehensive set of polyfills
    // for Node.js 'process' module, which some dependencies might be using.
    if (!isServer) {
      // Method 1: Fallback for imports like `import process from 'process'`
      config.resolve.fallback = {
        ...config.resolve.fallback,
        process: require.resolve('process/browser'),
      };
      
      // Method 2: Direct alias for the `node:process` import scheme.
      config.resolve.alias = {
        ...config.resolve.alias,
        'node:process': 'process/browser',
      };

      // Method 3: ProvidePlugin to make `process` available globally.
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
