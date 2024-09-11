const { withSentryConfig } = require("@sentry/nextjs");

const cspHeader = `
    default-src 'self';
    connect-src 'self' api.maptiler.com;
    script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: *.gouv.fr sentry.incubateur.net unpkg.com;
    style-src 'self' 'unsafe-inline' cdnjs.cloudflare.com unpkg.com;
    img-src * data: blob:;
    font-src 'self' data: cdnjs.cloudflare.com;
    frame-src 'self' metabase.incubateur.net;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'self';
    upgrade-insecure-requests;
`;

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
    sentry: {
        hideSourceMaps: true,
    },
};

const sentryWebpackPluginOptions = {
    // Additional config options for the Sentry webpack plugin. Keep in mind that
    // the following options are set automatically, and overriding them is not
    // recommended:
    //   release, url, configFile, stripPrefix, urlPrefix, include, ignore

    release: process.env.SOURCE_VERSION, // https://doc.scalingo.com/platform/app/environment#build-environment-variables
    org: "betagouv",
    project: "espace-membre",
    // An auth token is required for uploading source maps.
    authToken: process.env.SENTRY_AUTH_TOKEN,
    url: "https://sentry.incubateur.net",
    // silent: true, // Suppresses all logs
    errorHandler: (err, invokeErr, compilation) => {
        compilation.warnings.push("Sentry CLI Plugin: " + err.message);
    },
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options.
};

// Make sure adding Sentry options is the last code to run before exporting
module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions);
