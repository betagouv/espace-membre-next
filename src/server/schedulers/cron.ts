// NOTE: if you update this file, make sure you update the jobs
// documentation file (CRON.md) file with `make cron-docs`.

import { postEventsOnMattermost } from "./calendarScheduler";
import { deactivateExpiredMembersEmails } from "./emailScheduler";
import {
  addGithubUserToOrganization,
  removeGithubUserFromOrganization,
} from "./githubScheduler";
import {
  createUsersByEmail,
  moveUsersToAlumniTeam,
  reactivateUsers,
  removeUsersFromCommunityTeam,
  addUsersNotInCommunityToCommunityTeam,
  syncMattermostUserStatusWithMattermostMemberInfosTable,
  syncMattermostUserWithMattermostMemberInfosTable,
  sendGroupDeSoutienReminder,
} from "./mattermostScheduler";
import {
  removeBetaAndParnersUsersFromCommunityTeam,
  sendReminderToUserAtDays,
} from "./mattermostScheduler/removeBetaAndParnersUsersFromCommunityTeam";
import {
  newsletterReminder,
  sendNewsletterAndCreateNewOne,
} from "./newsletterScheduler";
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
  deleteRedirectionsAfterQuitting,
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

const mattermostJobs: EspaceMembreCronJobType[] = [
  {
    cronTime: "0 0 14 * * *", // Every day at 14:00
    onTick: removeBetaAndParnersUsersFromCommunityTeam,
    isActive: true,
    name: "removeBetaAndParnersUsersFromCommunityTeam",
    description: "Move expired user to mattermost alumni",
  },
  {
    cronTime: "0 0 14 * * 1", // Every Monday at 14:00
    onTick: () => sendReminderToUserAtDays({ nbDays: 90 }),
    isActive: true,
    name: "sendReminderToUserAtDays",
    description: "Send mattermost message to expired users (90 days)",
  },
  {
    cronTime: "0 0 5 * * 1", // Every Monday at 05:00
    onTick: () => sendReminderToUserAtDays({ nbDays: 30 }),
    isActive: !!config.FEATURE_MATTERMOST_REMOVE_USERS,
    name: "sendReminderToUserAtDays",
    description: "Send mattermost message to expired users (30 days)",
  },
  {
    cronTime: "0 0 10 * * *", // Every day at 10:00
    onTick: () => {
      sendGroupDeSoutienReminder("general", 1, 0);
    },
    isActive: true,
    name: "sendGroupDeSoutienReminder",
    description: "Send mattermost message groupe de soutien",
  },
  {
    cronTime: "0 */8 * * * *", // Every 8 minutes
    onTick: createUsersByEmail,
    isActive: !!config.featureCreateUserOnMattermost,
    name: "createUsersByEmail",
    description: "Create missing mattermost users and send invitation email",
  },
  {
    cronTime: "0 */8 * * * *", // Every 8 minutes
    onTick: addUsersNotInCommunityToCommunityTeam,
    isActive: !!config.featureAddUserToCommunityTeam,
    name: "addUsersNotInCommunityToCommunityTeam",
    description: "Add existing users to community team if there not in",
  },
  {
    cronTime: "0 0 8 1 * *", // 1st of every month at 08:00
    onTick: reactivateUsers,
    isActive: !!config.featureReactiveMattermostUsers,
    name: "reactivateUsers",
    description: "Reactivate mattermost accounts if any",
  },
  {
    cronTime: "0 0 10 * * *", // Every day at 10:00
    onTick: removeUsersFromCommunityTeam,
    isActive: !!config.featureRemoveExpiredUsersFromCommunityOnMattermost,
    name: "removeUsersFromCommunityTeam",
    description:
      "Remove expired users from mattermost community team (90 days)",
  },
  {
    cronTime: "0 10 10 * * *", // Every day at 10:10
    onTick: moveUsersToAlumniTeam,
    isActive: !!config.featureAddExpiredUsersToAlumniOnMattermost,
    name: "moveUsersToAlumniTeam",
    description: "Add user to mattermost alumni team",
  },
  // Post automatic
  {
    cronTime: config.CALENDAR_CRON_TIME || "0 30 17 * * 1", // Every Monday at 17:30
    onTick: () =>
      postEventsOnMattermost({
        numberOfDays: 6,
        canal: "general",
        calendarURL: config.CALENDAR_URL!,
        calendarPublicUrl: config.CALENDAR_PUBLIC_URL!,
        chatWebhook: config.CHAT_WEBHOOK_URL_GENERAL,
      }),
    timeZone: "Europe/Paris",
    isActive: true,
    name: "PostEventsFromBetaOnMattermost",
    description: "Post event of the week from betagouv calendar",
  },
  {
    cronTime: "0 0 8 * * 1", // Every Monday at 08:00
    onTick: () =>
      postEventsOnMattermost({
        numberOfDays: 6,
        calendarURL: config.CALENDAR_GIP_URL!,
        calendarPublicUrl: config.CALENDAR_GIP_PUBLIC_URL!,
        chatWebhook: config.CHAT_WEBHOOK_URL_GIP,
      }),
    timeZone: "Europe/Paris",
    isActive: true,
    name: "Post event of the week from gip calendar",
  },
];

const startupJobs: EspaceMembreCronJobType[] = [
  {
    cronTime: "0 0 5 * * 1", // Every Monday at 05:00
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
    cronTime: "0 15 19 * * *", // Every day at 19:15
    onTick: deleteMatomoAccount,
    isActive: !!config.FEATURE_DELETE_MATOMO_ACCOUNT,
    name: "deleteMatomoAccount",
    description: "Supprime les comptes matomos des membres expirés (30 days)",
  },
  {
    cronTime: "0 45 15 * * *", // Every day at 15:45
    onTick: deleteSentryAccount,
    isActive: !!config.FEATURE_DELETE_SENTRY_ACCOUNT,
    name: "deleteSentryAccount",
    description: "Supprime les comptes sentry des membres expirés (30 days)",
  },
  {
    cronTime: process.env.SYNC_MATOMO_ACCOUNT_CRON || "0 30 14 * * *", // Every day at 14:30
    onTick: () => syncMatomoAccounts(matomoClient),
    isActive: true,
    name: "syncMatomoAccounts",
    description: "Sync les comptes matomo des membres actifs",
  },
  {
    cronTime: process.env.SYNC_SENTRY_ACCOUNT_CRON || "0 30 14 * * *", // Every day at 14:30
    onTick: () => syncSentryAccounts(sentryClient),
    isActive: true,
    name: "syncSentryAccounts",
    description: "Sync les comptes sentry des membres actifs",
  },
];

const newsletterJobs: EspaceMembreCronJobType[] = [
  {
    cronTime: process.env.NEWSLETTER_FIRST_REMINDER_TIME || "0 0 10 * * 3", // Every Wednesday at 10:00
    onTick: () => newsletterReminder("FIRST_REMINDER"),
    isActive: config.FEATURE_NEWSLETTER,
    name: "newsletterFirstReminderJob",
    description: "Rappel mattermost newsletter 1",
  },
  {
    cronTime: process.env.NEWSLETTER_SECOND_REMINDER_TIME || "0 0 8 * * 2", // Every Tuesday at 08:00
    onTick: () => newsletterReminder("SECOND_REMINDER"),
    isActive: config.FEATURE_NEWSLETTER,
    name: "newsletterSecondReminderJob",
    description: "Rappel mattermost newsletter 2",
  },
  {
    cronTime: config.newsletterSendTime || "0 16 * * 2", // Every Tuesday at 16:00
    onTick: sendNewsletterAndCreateNewOne,
    isActive: config.FEATURE_NEWSLETTER,
    name: "sendNewsletterAndCreateNewOneJob",
    description:
      "Envoi de la newsletter et creation d'un nouveau PAD + message mattermost",
  },
];

const synchronizationJobs: EspaceMembreCronJobType[] = [
  {
    cronTime: "0 10 10 * * *", // Every day at 10:10
    onTick: syncMattermostUserWithMattermostMemberInfosTable,
    start: true,
    timeZone: "Europe/Paris",
    isActive: true,
    name: "syncMattermostUserWithMattermostMemberInfosTable",
    description: "Add new mattermost user to mattermost_member_info table",
  },
  {
    cronTime: "0 15 10 * * *", // Every day at 10:15
    onTick: syncMattermostUserStatusWithMattermostMemberInfosTable,
    start: true,
    timeZone: "Europe/Paris",
    isActive: true,
    name: "syncMattermostUserStatusWithMattermostMemberInfosTable",
    description:
      "Get mattermost user activity info from api and sync with mattermost_member_info table",
  },
];

export const espaceMembreCronJobs: EspaceMembreCronJobType[] = [
  ...newsletterJobs,
  ...mattermostJobs,
  ...startupJobs,
  ...servicesJobs,
  // ...metricJobs,
  // ...pullRequestJobs,
  ...synchronizationJobs,
  {
    cronTime: "0 0 0 * * 1", // every week a 0:00 on monday
    onTick: unblockEmailsThatAreActive,
    isActive: true,
    name: "Unblock blacklisted email",
    description:
      "Unblock emails from MAILING_LIST_NEWSLETTER Brevo mailing-list",
  },
  {
    cronTime: "0 0 * * * *", // Every hour
    onTick: recreateEmailIfUserActive,
    isActive: true,
    name: "recreateEmailIfUserActive",
    description: "Recreate email for user active again",
  },
  {
    cronTime: "0 */5 * * * 1-5", //  every 5 minutes, Monday to Friday (at :00, :05, :10, :15, etc.).
    onTick: addGithubUserToOrganization,
    isActive: !!config.featureAddGithubUserToOrganization,
    name: "addGithubUserToOrganization",
    description:
      "Envoi des invitations GitHub et ajout à la team GitHub/betagouv",
  },
  {
    cronTime: "0 0 18 * * *", // Every day at 18:00
    onTick: removeGithubUserFromOrganization,
    isActive: !!config.featureRemoveGithubUserFromOrganization,
    name: "removeGithubUserFromOrganization",
    description: "Désinscrit les membres expirés de l'organisation GitHub",
  },
  {
    cronTime: "0 0 8,14 * * *", // Every day at 08:00 and 14:00
    onTick: deleteRedirectionsAfterQuitting,
    isActive: !!config.featureDeleteRedirectionsAfterQuitting,
    name: "deleteRedirectionsAfterQuitting",
    description: "Supprime les redirections email OVH des utilisateurs expirés",
  },
  {
    cronTime: "0 0 8 * * *", // Every day at 08:00
    onTick: sendJ1Email,
    isActive: !!config.featureSendJ1Email,
    name: "sendJ1Email",
    description: "Email départ J+1",
  },
  {
    cronTime: "0 0 8 * * *", // Every day at 08:00
    onTick: sendJ30Email,
    isActive: !!config.featureSendJ30Email,
    name: "sendJ30Email",
    description: "Email départ J+30",
  },
  {
    cronTime: "0 0 * * * *", // Every hour
    onTick: deactivateExpiredMembersEmails,
    isActive: !!config.featureReinitPasswordEmail,
    name: "deactivateExpiredMembersEmails",
    description:
      "Désactive les comptes email des membres expirés après 5 jours",
  },
  {
    cronTime: "0 0 10 * * *", // Every day at 10:00
    onTick: () => sendContractEndingMessageToUsers("mail15days", true),
    isActive: !!config.featureOnUserContractEnd,
    name: "sendContractEndingMessageToUsers15days",
    description: "Sending contract ending message to users (15 days)",
  },
  {
    cronTime: "0 0 10 * * *", // Every day at 10:00
    onTick: () => sendContractEndingMessageToUsers("mail30days", true),
    isActive: !!config.featureOnUserContractEnd,
    name: "sendContractEndingMessageToUsers30days",
    description: "Sending contract ending message to users (30 days)",
  },
  {
    cronTime: "0 0 10 * * *", // Every day at 10:00
    onTick: () => sendContractEndingMessageToUsers("mail2days", false),
    isActive: !!config.featureOnUserContractEnd,
    name: "sendContractEndingMessageToUsers2days",
    description: "Sending contract ending message to users (2 days)",
  },
  {
    cronTime: "0 0 10 1 * *", // 1st of every month at 00:10
    onTick: sendMessageToActiveUsersWithoutSecondaryEmail,
    start: true,
    timeZone: "Europe/Paris",
    isActive: !!config.featureSendMessageToActiveUsersWithoutSecondaryEmail,
    name: "sendMessageToActiveUsersWithoutSecondaryEmail",
    description:
      "Send message to active user without secondary email to update secondary email",
  },
];
