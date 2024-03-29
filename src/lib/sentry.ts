import * as Sentry from "@sentry/node";
import { ErrorRequestHandler } from "express";
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

    app.use(Sentry.Handlers.requestHandler());
    app.use(Sentry.Handlers.tracingHandler());
};

export const sentryErrorHandler: ErrorRequestHandler =
    Sentry.Handlers.errorHandler();
