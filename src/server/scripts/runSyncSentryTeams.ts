import { sentryClient } from "../config/sentry.config";
import { syncSentryTeams } from "../schedulers/serviceScheduler/syncSentryTeams";

syncSentryTeams(sentryClient);
