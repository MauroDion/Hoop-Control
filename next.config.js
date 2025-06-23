
const webpack = require('webpack');

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Enable WebAssembly
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    // Add polyfill for `process` module.
    // We apply this to all builds (server and client) to be safe.
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}), // Ensure fallback is an object
      process: require.resolve('process/browser'),
    };
    
    // Provide the `process` variable globally to all modules
    config.plugins.push(
      new webpack.ProvidePlugin({
        process: 'process/browser',
      })
    );
    
    // Important: return the modified config
    return config;
  },
};

module.exports = nextConfig;
