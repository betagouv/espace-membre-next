import * as Sentry from "@sentry/nextjs";
// legacy-email-login: remove with src/lib/auth/legacyEmailLogin
import { PHASE_PRODUCTION_BUILD } from "next/constants";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // legacy-email-login: remove with src/lib/auth/legacyEmailLogin
    if (process.env.NEXT_PHASE !== PHASE_PRODUCTION_BUILD) {
      const { assertLegacyEmailLoginConfig } =
        await import("@/lib/auth/legacyEmailLogin/config");
      try {
        assertLegacyEmailLoginConfig();
      } catch (error) {
        // a throw here only turns every request into a 500 while the port
        // stays open, so the deploy would look healthy : exiting makes it fail
        // and keeps the previous version running
        console.error(error);
        process.exit(1);
      }
    }
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

      // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
      tracesSampleRate: 0.5,

      // Enable logs to be sent to Sentry
      enableLogs: true,
      integrations: [Sentry.consoleLoggingIntegration()],

      // Setting this option to true will print useful information to the console while you're setting up Sentry.
      debug: false,
    });
  }
}

export const onRequestError = Sentry.captureRequestError;
