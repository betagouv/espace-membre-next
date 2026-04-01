// NOTE: if you update this file, make sure you update the jobs
// documentation file (CRON.md) file with `make cron-docs`.

import { syncMattermostUserWithMattermostMemberInfosTable } from "./mattermostScheduler/syncMattermostUserWithMattermostMemberInfosTable";
import { recreateEmailIfUserActive } from "./recreateEmailIfUserActive";
import { syncMatomoAccounts } from "./serviceScheduler/syncMatomoAccounts";
import { syncSentryAccounts } from "./serviceScheduler/syncSentryAccounts";
import { sendEmailToStartupToUpdatePhase } from "./startups/sendEmailToStartupToUpdatePhase";
import { unblockEmailsThatAreActive } from "./unblockEmailsThatAreActive";
import {
  deleteMatomoAccount,
  deleteSentryAccount,
} from "./userContractEndingScheduler";
import { matomoClient } from "../config/matomo.config";
import { sentryClient } from "../config/sentry.config";
import config from "@/server/config";

export interface EspaceMembreCronJobType {
  cronTime: string;
  onTick: (any) => any;
  isActive: boolean;
  name: string;
  description?: string;
  timeZone?: string;
  start?: boolean;
}

const startupJobs: EspaceMembreCronJobType[] = [
  /*{
    // TODO: move to N8N and dimail ?
    cronTime: "0 5 * * 1", // Every Monday at 05:00
    onTick: createMailingListForStartups,
    isActive: true,
    name: "createMailingListForStartups",
    description: "Créé des mailings-list OVH pour les startups",
  },*/
  {
    cronTime: "30 09 01 Jan,Apr,Jul,Oct *", // 1st of Jan, Apr, Jul, Oct at 09:00:30
    onTick: sendEmailToStartupToUpdatePhase,
    isActive: config.FEATURE_SEND_EMAIL_TO_STARTUP_TO_UPDATE_PHASE,
    name: "sendEmailToStartupToUpdatePhase",
    description:
      "Envoie par mail une relance pour mise à jour de la phase de la SE",
  },
];

const servicesJobs: EspaceMembreCronJobType[] = [
  {
    cronTime: "15 19 * * *", // Every day at 19:15
    onTick: deleteMatomoAccount,
    isActive: !!config.FEATURE_DELETE_MATOMO_ACCOUNT,
    name: "deleteMatomoAccount",
    description: "Supprime les comptes matomos des membres expirés (30 days)",
  },
  {
    cronTime: "45 15 * * *", // Every day at 15:45
    onTick: deleteSentryAccount,
    isActive: !!config.FEATURE_DELETE_SENTRY_ACCOUNT,
    name: "deleteSentryAccount",
    description: "Supprime les comptes sentry des membres expirés (30 days)",
  },
  {
    cronTime: process.env.SYNC_MATOMO_ACCOUNT_CRON || "30 14 * * *", // Every day at 14:30
    onTick: () => syncMatomoAccounts(matomoClient),
    isActive: true,
    name: "syncMatomoAccounts",
    description: "Sync les comptes matomo des membres actifs",
  },
  {
    cronTime: process.env.SYNC_SENTRY_ACCOUNT_CRON || "30 14 * * *", // Every day at 14:30
    onTick: () => syncSentryAccounts(sentryClient),
    isActive: true,
    name: "syncSentryAccounts",
    description: "Sync les comptes sentry des membres actifs",
  },
];

const synchronizationJobs: EspaceMembreCronJobType[] = [
  {
    cronTime: "10 10 * * *", // Every day at 10:10
    onTick: syncMattermostUserWithMattermostMemberInfosTable,
    start: true,
    timeZone: "Europe/Paris",
    isActive: true,
    name: "syncMattermostUserWithMattermostMemberInfosTable",
    description: "Add new mattermost user to mattermost_member_info table",
  },
];

export const espaceMembreCronJobs: EspaceMembreCronJobType[] = [
  ...startupJobs,
  ...servicesJobs,
  ...synchronizationJobs,
  {
    cronTime: "0 0 * * 1", // every week at 0:00 on monday
    onTick: unblockEmailsThatAreActive,
    isActive: true,
    name: "Unblock blacklisted email",
    description:
      "Unblock emails from MAILING_LIST_NEWSLETTER Brevo mailing-list",
  },
  {
    cronTime: "0 * * * *", // Every hour
    onTick: recreateEmailIfUserActive,
    isActive: true,
    name: "recreateEmailIfUserActive",
    description: "Recreate email for user active again",
  },
];
