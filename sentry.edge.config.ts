import * as Sentry from "@sentry/nextjs";

import { dsn, environment, release } from "@/utils/sentry";

Sentry.init({
    dsn,
    release,
    environment: environment,
    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 0.5,
});
