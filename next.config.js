const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: [
                    {
                        key: "Content-Security-Policy",
                        value: cspHeader.replace(/\n/g, ""),
                    },
                ],
            },
        ];
    },
    experimental: {
        serverComponentsExternalPackages: ["knex", "sib-api-v3-sdk"],
        serverActions: {
            bodySizeLimit: "10mb",
        },
    },
    sentry: {
        disableServerWebpackPlugin: true,
        disableClientWebpackPlugin: true,
    },
    webpack: (config, { isServer }) => {
        if (!isServer) {
            // don't resolve 'fs' module on the client to prevent this error on build --> Error: Can't resolve 'fs'
            config.resolve.fallback = {
                fs: false,
            };
        }
        config.module.rules.push({
            test: /\.woff2$/,
            type: "asset/resource",
        });
        return config;
    },
};

const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' *.gouv.fr sentry.incubateur.net;
    style-src 'self' 'unsafe-inline';
    img-src https: data:;
    font-src 'self' data:;
    frame-src 'self' metabase.incubateur.net;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
`;

const sentryWebpackPluginOptions = {
    // Additional config options for the Sentry webpack plugin. Keep in mind that
    // the following options are set automatically, and overriding them is not
    // recommended:
    //   release, url, configFile, stripPrefix, urlPrefix, include, ignore
    //org: "example-org",
    //project: "example-project",
    // An auth token is required for uploading source maps.
    //authToken: process.env.SENTRY_AUTH_TOKEN,
    //silent: true, // Suppresses all logs
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options.
};

// Make sure adding Sentry options is the last code to run before exporting
module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions);
