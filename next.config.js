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
  eslint: {
    dirs: ["src", "__tests__"],
    ignoreDuringBuilds: true,
  },
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
      // Basic redirect
      {
        source: "/",
        destination: "/login",
        permanent: true,
      },
    ];
  },
  experimental: {
    instrumentationHook: true,
    serverComponentsExternalPackages: [
      "knex",
      "sib-api-v3-sdk",
      "mjml",
      "@luma-team/mjml-react",
    ],
    serverActions: {
      bodySizeLimit: "10mb",
    },
    // This is experimental but can
    // be enabled to allow parallel threads
    // with nextjs automatic static generation
    // during prerendering it access the db and in review app in breaks because there is several connexion
    // we could disable prerendering but it is not possible to disable it only at build time
    workerThreads: false,
    cpus: 1,
  },
  rewrites: async () => [
    {
      source: "/api/public/member/:username/image",
      destination: "/api/member/:username/image",
    },
  ],
  // @todo upgrade to nextjs 15 to use
  // expireTime: 0,
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
  debug: true,
  telemetry: false,
  //silent: false,
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
    disable: !uploadToSentry,
  },
  release: {
    name: process.env.SOURCE_VERSION, // https://doc.scalingo.com/platform/app/environment#build-environment-variables
    inject: uploadToSentry,
  },
  org: "betagouv",
  project: "espace-membre",
  widenClientFileUpload: uploadToSentry, // https://sentry.zendesk.com/hc/en-us/articles/28813179249691-Frames-from-static-chunks-folder-are-not-source-mapped
  authToken: process.env.SENTRY_AUTH_TOKEN,
  url: "https://sentry.incubateur.net",
  disableLogger: true,
  errorHandler: (err, invokeErr, compilation) => {
    compilation.warnings.push("Sentry CLI Plugin: " + err.message);
  },
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#Options
};

// Make sure adding Sentry options is the last code to run before exporting
module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions);
