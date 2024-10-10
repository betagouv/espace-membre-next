import * as Sentry from "@sentry/node";

import config from "@/server/config";

export const initializeSentry = (app) => {
    if (!config.sentryDSN) {
        console.log("Sentry DSN not found. Sentry is not initialized.");
        return;
    }

    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        tracesSampleRate: 1.0,
    });
};
