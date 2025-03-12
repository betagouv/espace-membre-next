import * as Sentry from "@sentry/nextjs";

import { dsn, release, environment } from "@/utils/sentry";

Sentry.init({
    dsn,
    release,
    environment,
    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 0.5,
});
