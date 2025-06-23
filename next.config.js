
const webpack = require('webpack');

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Add support for WebAssembly, needed by dependencies like farmhash-modern.
    config.experiments = { ...config.experiments, asyncWebAssembly: true, layers: true };

    // The 'node:process' module causes build errors in the browser.
    // The following configuration applies a robust, three-part fix
    // ONLY to the client-side bundle to avoid breaking the server build.
    if (!isServer) {
      // 1. Fallback: Tells Webpack to use 'process/browser' whenever it
      // sees an import for the 'process' module.
      config.resolve.fallback = {
        ...config.resolve.fallback,
        process: require.resolve('process/browser'),
      };

      // 2 & 3. Plugins: Forcefully replace `node:process` and provide `process` globally.
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /^node:process$/,
          require.resolve('process/browser')
        ),
        new webpack.ProvidePlugin({
          process: 'process/browser',
        })
      );
    }
    
    return config;
  },
};

module.exports = nextConfig;
