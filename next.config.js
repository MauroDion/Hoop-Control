
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Add support for WebAssembly, needed by dependencies like farmhash-modern.
    config.experiments = { ...config.experiments, asyncWebAssembly: true, layers: true };

    // The 'node:process' module causes build errors in the browser.
    // This direct alias tells Webpack to replace any import of 'node:process'
    // with the browser-compatible 'process/browser' package.
    // This fix is only applied to the client-side bundle.
    if (!isServer) {
      if (!config.resolve.alias) {
        config.resolve.alias = {};
      }
      Object.assign(config.resolve.alias, {
        'node:process': 'process/browser',
      });
    }
    
    return config;
  },
};

module.exports = nextConfig;
