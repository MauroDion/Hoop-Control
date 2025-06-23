
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
        process: 'process/browser',
      };

      // 2. Replacement Plugin: Forcefully intercepts any import for the exact
      // string 'node:process' and replaces it with the browser version.
      // This is the most direct fix for the error message.
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /^node:process$/,
          'process/browser'
        )
      );

      // 3. Provide Plugin: Makes the 'process' object globally available
      // in the client-side code, which some libraries expect.
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
