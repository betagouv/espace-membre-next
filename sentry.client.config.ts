import * as Sentry from "@sentry/nextjs";

import { dsn, environment, release } from "@/utils/sentry";

Sentry.init({
    dsn: dsn,
    environment: environment,
    debug: false,
    release: release,
    integrations: [
        Sentry.replayIntegration({
            block: ["[data-sentry-block]", ".crisp-client"],
            mask: ["[data-sentry-mask]", ".crisp-client"],
        }),
    ],

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 0.5,

    // Capture Replay for 10% of all sessions,
    // plus for 100% of sessions with an error
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1,
});
