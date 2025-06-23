
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // The 'node:process' module causes build errors in the browser.
    // This direct alias tells Webpack to replace any import of 'node:process'
    // with the browser-compatible 'process/browser' package.
    // This fix is only applied to the client-side bundle.
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'node:process': 'process/browser',
      };
    }
    
    return config;
  },
};

module.exports = nextConfig;
