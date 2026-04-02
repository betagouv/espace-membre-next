// NOTE: if you update this file, make sure you update the jobs
// documentation file (CRON.md) file with `make cron-docs`.

import config from "@/server/config";
import { getBossClientInstance, startBossClientInstance } from "./client";
import { cleanTeamsMembersTopic } from "./workers/clean-teams-members";
import { deleteMatomoAccountTopic } from "./workers/delete-matomo-account";
import { deleteSentryAccountTopic } from "./workers/delete-sentry-account";
import { recreateEmailIfUserActiveTopic } from "./workers/recreate-email-if-user-active";
import { sendEmailToStartupToUpdatePhaseTopic } from "./workers/send-email-to-startup-to-update-phase";
import { sendEmailToIncubatorTeamTopic } from "./workers/send-email-to-incubator";
import { sendEmailToTeamsToCheckOnTeamCompositionTopic } from "./workers/send-email-to-teams-to-check-on-team-composition";
import { syncDinumEmailsTopic } from "./workers/sync-dinum-emails";
import { syncMatomoAccountsTopic } from "./workers/sync-matomo-accounts";
import { syncMattermostUsersTopic } from "./workers/sync-mattermost-users";
import { syncSentryAccountsTopic } from "./workers/sync-sentry-accounts";
import { unblockBlacklistedEmailsTopic } from "./workers/unblock-blacklisted-emails";

export type PgBossJobType = {
  topic: string;
  frequency: string;
  description: string;
};

export const pgBossJobs: PgBossJobType[] = [
  {
    topic: sendEmailToTeamsToCheckOnTeamCompositionTopic,
    frequency: `0 8 1 */3 *`,
    description: `Envoie un email aux équipes produits pour qu'ils vérifient la composition de leur équipe`,
  },
  {
    topic: sendEmailToIncubatorTeamTopic,
    frequency: `0 8 1 */3 *`,
    description: `Envoie un email aux équipes incubateur pour qu'ils vérifient les produits qui n'ont pas changé depuis X mois`,
  },
  {
    topic: syncDinumEmailsTopic,
    frequency: `0 8-18 * * *`,
    description: `Met à jour la table dinum_emails`,
  },
  {
    topic: cleanTeamsMembersTopic,
    frequency: `0 8 * * *`,
    description: `Supprime les membres expirés des équipes incubateurs`,
  },
  {
    topic: syncMattermostUsersTopic,
    frequency: `10 10 * * *`,
    description: `Synchronise les utilisateurs Mattermost avec la table mattermost_member_infos`,
  },
  {
    topic: syncMatomoAccountsTopic,
    frequency: process.env.SYNC_MATOMO_ACCOUNT_CRON || `30 14 * * *`,
    description: `Synchronise les comptes Matomo des membres actifs`,
  },
  {
    topic: syncSentryAccountsTopic,
    frequency: process.env.SYNC_SENTRY_ACCOUNT_CRON || `30 14 * * *`,
    description: `Synchronise les comptes Sentry des membres actifs`,
  },
  {
    topic: unblockBlacklistedEmailsTopic,
    frequency: `0 0 * * 1`,
    description: `Débloque les emails blacklistés de la liste Brevo MAILING_LIST_NEWSLETTER`,
  },
  {
    topic: recreateEmailIfUserActiveTopic,
    frequency: `0 * * * *`,
    description: `Recrée les emails pour les utilisateurs redevenus actifs`,
  },
  ...(config.FEATURE_DELETE_MATOMO_ACCOUNT
    ? [
        {
          topic: deleteMatomoAccountTopic,
          frequency: `15 19 * * *`,
          description: `Supprime les comptes Matomo des membres expirés (30 jours)`,
        },
      ]
    : []),
  ...(config.FEATURE_DELETE_SENTRY_ACCOUNT
    ? [
        {
          topic: deleteSentryAccountTopic,
          frequency: `45 15 * * *`,
          description: `Supprime les comptes Sentry des membres expirés (30 jours)`,
        },
      ]
    : []),
  ...(config.FEATURE_SEND_EMAIL_TO_STARTUP_TO_UPDATE_PHASE
    ? [
        {
          topic: sendEmailToStartupToUpdatePhaseTopic,
          frequency: `30 9 1 1,4,7,10 *`,
          description: `Envoie par mail une relance pour mise à jour de la phase de la SE`,
        },
      ]
    : []),
];

export async function scheduleBossCronTasks() {
  const bossClient = await getBossClientInstance();

  // cron tasks
  for (const job of pgBossJobs) {
    console.log(`Start scheduled pbboss job ${job.topic} : ${job.frequency}`);
    await bossClient.schedule(job.topic, job.frequency, undefined, {
      tz: "Europe/Paris",
    });
  }
  console.log(
    `Started ${pgBossJobs.length} pgboss cron jobs : \n ${pgBossJobs
      .map((job) => job.topic)
      .join("\n")}`,
  );
}
