const { withSentryConfig } = require("@sentry/nextjs");

const cspHeader = `
    default-src 'self';
    connect-src 'self' api.maptiler.com espace-membre.cellar-c2.services.clever-cloud.com espace-membre-staging.cellar-c2.services.clever-cloud.com *.gouv.fr sentry.incubateur.net https://client.crisp.chat https://storage.crisp.chat wss://client.relay.crisp.chat wss://stream.relay.crisp.chat https://nominatim.openstreetmap.org;
    script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: *.gouv.fr sentry.incubateur.net unpkg.com https://client.crisp.chat https://settings.crisp.chat;
    style-src 'self' 'unsafe-inline' cdnjs.cloudflare.com unpkg.com https://client.crisp.chat;
    img-src * data: blob: https://client.crisp.chat https://image.crisp.chat https://storage.crisp.chat;
    font-src 'self' data: cdnjs.cloudflare.com https://client.crisp.chat;
    frame-src 'self' metabase.incubateur.net https://game.crisp.chat;
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
                        value:
                            process.env.NODE_ENV === "production"
                                ? cspHeader.replace(/\n/g, "")
                                : cspHeader
                                      .replace("upgrade-insecure-requests;", "")
                                      .replace(/\n/g, ""),
                    },
                ],
            },
        ];
    },
    async redirects() {
        return [
            // Basic redirect
            {
                source: "/",
                destination: "/login",
                permanent: true,
            },
        ];
    },
    experimental: {
        serverComponentsExternalPackages: [
            "knex",
            "sib-api-v3-sdk",
            "mjml",
            "@luma-team/mjml-react",
        ],
        serverActions: {
            bodySizeLimit: "10mb",
        },
    },
    rewrites: async () => [
        {
            source: "/api/public/member/:username/image",
            destination: "/api/member/:username/image",
        },
    ],
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

const uploadToSentry =
    process.env.NODE_ENV === "production" &&
    process.env.SENTRY_RELEASE_UPLOAD === "true";

/**
 * @type {import('@sentry/nextjs').SentryBuildOptions}
 */
const sentryWebpackPluginOptions = {
    // Additional config options for the Sentry webpack plugin. Keep in mind that
    // the following options are set automatically, and overriding them is not
    // recommended:
    //   release, url, configFile, stripPrefix, urlPrefix, include, ignore
    debug: false,
    telemetry: false,
    silent: false,
    sourcemaps: {
        deleteSourcemapsAfterUpload: true,
        disable: !uploadToSentry,
    },
    hideSourceMaps: true,
    release: process.env.SOURCE_VERSION, // https://doc.scalingo.com/platform/app/environment#build-environment-variables
    org: "betagouv",
    project: "espace-membre",
    widenClientFileUpload: true, // https://sentry.zendesk.com/hc/en-us/articles/28813179249691-Frames-from-static-chunks-folder-are-not-source-mapped
    // cause static/chunks/ to be uploaded
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
