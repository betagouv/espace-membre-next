// NOTE: if you update this file, make sure you update the jobs
// documentation file (CRON.md) file with `make cron-docs`.

import { deactivateExpiredMembersEmails } from "./emailScheduler";
import {
  addGithubUserToOrganization,
  removeGithubUserFromOrganization,
} from "./githubScheduler";
import { syncMattermostUserWithMattermostMemberInfosTable } from "./mattermostScheduler/syncMattermostUserWithMattermostMemberInfosTable";
import { recreateEmailIfUserActive } from "./recreateEmailIfUserActive";
import { syncMatomoAccounts } from "./serviceScheduler/syncMatomoAccounts";
import { syncSentryAccounts } from "./serviceScheduler/syncSentryAccounts";
import { createMailingListForStartups } from "./startups/createMailingListForStartups";
import { sendEmailToStartupToUpdatePhase } from "./startups/sendEmailToStartupToUpdatePhase";
import { unblockEmailsThatAreActive } from "./unblockEmailsThatAreActive";
import { sendMessageToActiveUsersWithoutSecondaryEmail } from "./updateProfileScheduler";
import {
  sendContractEndingMessageToUsers,
  sendJ1Email,
  sendJ30Email,
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
  {
    cronTime: "0 5 * * 1", // Every Monday at 05:00
    onTick: createMailingListForStartups,
    isActive: true,
    name: "createMailingListForStartups",
    description: "Créé des mailings-list OVH pour les startups",
  },
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
  {
    cronTime: "*/5 * * * 1-5", //  every 5 minutes, Monday to Friday (at :00, :05, :10, :15, etc.).
    onTick: addGithubUserToOrganization,
    isActive: !!config.featureAddGithubUserToOrganization,
    name: "addGithubUserToOrganization",
    description:
      "Envoi des invitations GitHub et ajout à la team GitHub/betagouv",
  },
  {
    cronTime: "0 18 * * *", // Every day at 18:00
    onTick: removeGithubUserFromOrganization,
    isActive: !!config.featureRemoveGithubUserFromOrganization,
    name: "removeGithubUserFromOrganization",
    description: "Désinscrit les membres expirés de l'organisation GitHub",
  },
  {
    cronTime: "0 8 * * *", // Every day at 08:00
    onTick: sendJ1Email,
    isActive: !!config.featureSendJ1Email,
    name: "sendJ1Email",
    description: "Email départ J+1",
  },
  {
    cronTime: "0 8 * * *", // Every day at 08:00
    onTick: sendJ30Email,
    isActive: !!config.featureSendJ30Email,
    name: "sendJ30Email",
    description: "Email départ J+30",
  },
  {
    // INACTIVE by config
    cronTime: "0 * * * *", // Every hour
    onTick: deactivateExpiredMembersEmails,
    isActive: !!config.featureReinitPasswordEmail,
    name: "deactivateExpiredMembersEmails",
    description:
      "Désactive les comptes email des membres expirés après 5 jours",
  },
  {
    cronTime: "0 10 * * *", // Every day at 10:00
    onTick: () => sendContractEndingMessageToUsers("mail15days", true),
    isActive: !!config.featureOnUserContractEnd,
    name: "sendContractEndingMessageToUsers15days",
    description: "Sending contract ending message to users (15 days)",
  },
  {
    cronTime: "0 10 * * *", // Every day at 10:00
    onTick: () => sendContractEndingMessageToUsers("mail30days", true),
    isActive: !!config.featureOnUserContractEnd,
    name: "sendContractEndingMessageToUsers30days",
    description: "Sending contract ending message to users (30 days)",
  },
  {
    cronTime: "0 10 * * *", // Every day at 10:00
    onTick: () => sendContractEndingMessageToUsers("mail2days", false),
    isActive: !!config.featureOnUserContractEnd,
    name: "sendContractEndingMessageToUsers2days",
    description: "Sending contract ending message to users (2 days)",
  },
  {
    cronTime: "0 10 1 * *", // 1st of every month at 10:00
    onTick: sendMessageToActiveUsersWithoutSecondaryEmail,
    start: true,
    timeZone: "Europe/Paris",
    isActive: !!config.featureSendMessageToActiveUsersWithoutSecondaryEmail,
    name: "sendMessageToActiveUsersWithoutSecondaryEmail",
    description:
      "Send message to active user without secondary email to update secondary email",
  },
];
