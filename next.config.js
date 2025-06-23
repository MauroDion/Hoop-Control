/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Add support for WebAssembly, needed by dependencies like farmhash-modern.
    config.experiments = { ...config.experiments, asyncWebAssembly: true, layers: true };

    // Apply polyfills and fallbacks only to the client-side bundle.
    if (!isServer) {
      // Polyfill for `process` module.
      config.resolve.fallback = {
        ...config.resolve.fallback,
        process: require.resolve('process/browser'),
      };
    }

    return config;
  },
};

module.exports = nextConfig;
