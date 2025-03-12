import * as Sentry from "@sentry/nextjs";

import { dsn, release } from "@/utils/sentry";

Sentry.init({
    dsn,
    integrations: [Sentry.replayIntegration()],
    release,
    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 0.5,

    // Capture Replay for 10% of all sessions,
    // plus for 100% of sessions with an error
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1,
});
