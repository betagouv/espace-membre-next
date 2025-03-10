import * as Sentry from "@sentry/nextjs";

import { dsn, release } from "@/utils/sentry";

export async function register() {
    if (process.env.NEXT_RUNTIME === "nodejs") {
        Sentry.init({
            dsn,

            // Set tracesSampleRate to 1.0 to capture 100%
            // of transactions for performance monitoring.
            // We recommend adjusting this value in production
            tracesSampleRate: 0.5,
            debug: false,
            release: release,
            autoSessionTracking: true,
        });
    }

    if (process.env.NEXT_RUNTIME === "edge") {
        Sentry.init({
            dsn,

            // Set tracesSampleRate to 1.0 to capture 100%
            // of transactions for performance monitoring.
            // We recommend adjusting this value in production
            tracesSampleRate: 0.5,
            debug: false,
            release: release,
            autoSessionTracking: true,
        });
    }
}
