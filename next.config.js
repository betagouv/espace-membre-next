const { withSentryConfig } = require("@sentry/nextjs");

const cspHeader = `
    default-src 'self';
    connect-src 'self' api.maptiler.com espace-membre.cellar-c2.services.clever-cloud.com espace-membre-staging.cellar-c2.services.clever-cloud.com *.gouv.fr sentry.incubateur.net https://client.crisp.chat https://storage.crisp.chat wss://client.relay.crisp.chat wss://stream.relay.crisp.chat https://nominatim.openstreetmap.org;
    script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: *.gouv.fr sentry.incubateur.net unpkg.com https://client.crisp.chat https://settings.crisp.chat;
    style-src 'self' 'unsafe-inline' cdnjs.cloudflare.com unpkg.com https://client.crisp.chat;
    img-src * data: blob: https://client.crisp.chat https://image.crisp.chat https://storage.crisp.chat;
    font-src 'self' data: cdnjs.cloudflare.com https://client.crisp.chat;
    frame-src 'self' metabase.incubateur.net https://game.crisp.chat https://faq-betagouv.crisp.help;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'self';
    upgrade-insecure-requests;
`;

/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: true,
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
  deploymentId: process.env.SOURCE_VERSION,
  async redirects() {
    return [
      {
        source: "/",
        destination: "/login",
        permanent: true,
      },
    ];
  },
  serverExternalPackages: [
    "knex",
    "sib-api-v3-sdk",
    "mjml",
    "@luma-team/mjml-react",
  ],
  experimental: {
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

module.exports = nextConfig;

const uploadToSentry =
  process.env.NODE_ENV === "production" &&
  process.env.SENTRY_RELEASE_UPLOAD === "true";

/**
 * @type {import('@sentry/nextjs').SentryBuildOptions}
 */
const sentryWebpackPluginOptions = {
  debug: true,
  telemetry: false,
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
    disable: !uploadToSentry,
  },
  release: {
    name: process.env.SOURCE_VERSION,
    inject: uploadToSentry,
  },
  org: "betagouv",
  project: "espace-membre",
  widenClientFileUpload: uploadToSentry,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  url: "https://sentry.incubateur.net",
  errorHandler: (err, invokeErr, compilation) => {
    console.error("Sentry CLI Plugin: " + err.message);
  },
};

module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions);
