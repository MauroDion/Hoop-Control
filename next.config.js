
/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'placehold.co',
            },
        ],
    },
    transpilePackages: ['firebase'],
    webpack: (config, { isServer }) => {
        // This is to polyfill `process` which is not available in the browser.
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                process: require.resolve('process/browser'),
            };

            config.plugins.push(
                new (require('webpack').ProvidePlugin)({
                    process: 'process/browser',
                })
            );
        }
        
        // Exclude server-side packages from the bundle for both client and server.
        // This prevents Webpack from trying to parse native Node.js addons like `farmhash.node`
        // which are dependencies of `firebase-admin`.
        config.externals.push('firebase-admin', 'farmhash');
        
        return config;
    },
};

module.exports = nextConfig;
