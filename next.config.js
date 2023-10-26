/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
      serverComponentsExternalPackages: ['knex'],
    },
    webpack: (config, { isServer })  => {
        if (!isServer) {
            // don't resolve 'fs' module on the client to prevent this error on build --> Error: Can't resolve 'fs'
            config.resolve.fallback = {
                fs: false
            }
        }
      config.module.rules.push({
        test: /\.woff2$/,
        type: "asset/resource"
      });
      return config;
    }
};
  
module.exports = nextConfig
