import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  integrations: [Sentry.replayIntegration()],
  beforeSend(event, hint) {
    const isFromMatomo = event.exception?.values?.some((exception) =>
      exception.stacktrace?.frames?.some((frame) =>
        frame.filename?.includes("matomo.js"),
      ),
    );

    if (isFromMatomo) {
      console.warn("Ignoring error from matomo.js");
      return null; // Skip sending this error
    }

    return event;
  },
  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 0.5,

  // Capture Replay for 10% of all sessions,
  // plus for 100% of sessions with an error
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  ignoreErrors: [
    "https://reactjs.org/docs/error-decoder.html?invariant=418", // ignore minified react error
    "https://reactjs.org/docs/error-decoder.html?invariant=423", // ignore minified react error
  ],
});
