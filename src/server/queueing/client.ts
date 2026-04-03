import * as Sentry from "@sentry/nextjs";
import PgBoss from "pg-boss";

import {
  createSentryServiceAccount,
  createSentryServiceAccountTopic,
} from "./workers/create-sentry-account";
import {
  createSentryTeam,
  createSentryTeamTopic,
} from "./workers/create-sentry-team";
import {
  createOrUpdateMatomoServiceAccount,
  createOrUpdateMatomoServiceAccountTopic,
} from "./workers/create-update-matomo-account";
import {
  sendEmailToIncubatorTeam,
  sendEmailToIncubatorTeamTopic,
} from "./workers/send-email-to-incubator";
import {
  sendEmailToTeamsToCheckOnTeamComposition,
  sendEmailToTeamsToCheckOnTeamCompositionTopic,
} from "./workers/send-email-to-teams-to-check-on-team-composition";
import {
  sendNewMemberValidationEmail,
  sendNewMemberValidationEmailTopic,
} from "./workers/send-validation-email";
import {
  sendNewMemberVerificationEmail,
  sendNewMemberVerificationEmailTopic,
} from "./workers/send-verification-email";
import {
  updateSentryServiceAccount,
  updateSentryServiceAccountTopic,
} from "./workers/update-sentry-account";
import {
  createDimailMailbox,
  createDimailMailboxTopic,
} from "./workers/create-dimail-mailbox";
import { gracefulExit } from "@/utils/gracefulExit";
import {
  syncDinumEmails,
  syncDinumEmailsTopic,
} from "./workers/sync-dinum-emails";
import {
  cleanTeamsMembers,
  cleanTeamsMembersTopic,
} from "./workers/clean-teams-members";
import {
  deleteMatomoAccountWorker,
  deleteMatomoAccountTopic,
} from "./workers/delete-matomo-account";
import {
  deleteSentryAccountWorker,
  deleteSentryAccountTopic,
} from "./workers/delete-sentry-account";
import {
  recreateEmailIfUserActiveWorker,
  recreateEmailIfUserActiveTopic,
} from "./workers/recreate-email-if-user-active";
import {
  sendEmailToStartupToUpdatePhaseWorker,
  sendEmailToStartupToUpdatePhaseTopic,
} from "./workers/send-email-to-startup-to-update-phase";
import {
  syncMatomoAccountsWorker,
  syncMatomoAccountsTopic,
} from "./workers/sync-matomo-accounts";
import {
  syncMattermostUsers,
  syncMattermostUsersTopic,
} from "./workers/sync-mattermost-users";
import {
  syncSentryAccountsWorker,
  syncSentryAccountsTopic,
} from "./workers/sync-sentry-accounts";
import {
  unblockBlacklistedEmails,
  unblockBlacklistedEmailsTopic,
} from "./workers/unblock-blacklisted-emails";

let databaseUrl = process.env.DATABASE_URL || "";
databaseUrl = databaseUrl.replace("sslmode=prefer", "sslmode=no-verify");
const bossClient = new PgBoss({
  application_name: "pg-boss",
  connectionString: databaseUrl,
  newJobCheckIntervalSeconds: 30, // No need to check every 2 seconds as set by default to look at new jobs
  deleteAfterDays: 45, // Give some time before cleaning archives so an issue can be investigated without dealing with database backups
});

bossClient.on("error", (error) => {
  // This error catcher is just for internal operations on pb-boss (fetching, maintenance...)
  // `onComplete` is the proper way to watch job errors
  console.error(error);

  Sentry.captureException(error);
});

let initPromise: Promise<void> | null = null;

export async function getBossClientInstance(
  callback?: () => void,
): Promise<PgBoss> {
  if (!initPromise) {
    initPromise = (async () => {
      await bossClient.start();
      if (callback) {
        await callback();
      }
    })();
  }

  // `await` is done outside the condition in case of concurrent init
  try {
    await initPromise;
  } catch (error) {
    gracefulExit(error as unknown as Error);
  }
  return bossClient;
}

export const pgBossWorker: {
  topic: string;
  worker: (job: PgBoss.Job<any>) => Promise<void>;
  description: string;
}[] = [
  {
    topic: createOrUpdateMatomoServiceAccountTopic,
    worker: createOrUpdateMatomoServiceAccount,
    description:
      "Créer ou update un compte matomo quand un utilisateur en fait la demande",
  },
  {
    topic: createSentryServiceAccountTopic,
    worker: createSentryServiceAccount,
    description:
      "Créer un compte sentry quand un utilisateur en fait la demande",
  },
  {
    topic: createSentryTeamTopic,
    worker: createSentryTeam,
    description:
      "Créer une équipe sentry quand un utilisateur en fait la demande",
  },
  {
    topic: updateSentryServiceAccountTopic,
    worker: updateSentryServiceAccount,
    description: `Ajoute une équipe au compte sentry d'un utilisateur`,
  },
  {
    topic: sendNewMemberValidationEmailTopic,
    worker: sendNewMemberValidationEmail,
    description: `Envoie un email aux membres de la startup d'un nouveau membre pour que quelqu'un valide sa fiche`,
  },
  {
    topic: sendNewMemberVerificationEmailTopic,
    worker: sendNewMemberVerificationEmail,
    description: `Envoie un email au nouveau membre pour l'inviter à compléter sa fiche`,
  },
  {
    topic: sendEmailToTeamsToCheckOnTeamCompositionTopic,
    worker: sendEmailToTeamsToCheckOnTeamComposition,
    description: `Envoie un email aux membres d'un produit pour qu'il valide sa composition`,
  },
  {
    topic: sendEmailToIncubatorTeamTopic,
    worker: sendEmailToIncubatorTeam,
    description: `Envoie un email aux membres des incubateurs pour leur lister les produits qui n'ont pas changé depuis X mois`,
  },
  {
    topic: createDimailMailboxTopic,
    worker: createDimailMailbox,
    description: `Créer une boite mail Dimail pour un utilisateur`,
  },
  {
    topic: syncDinumEmailsTopic,
    worker: syncDinumEmails,
    description: `Synchzonise la table dinum_emails`,
  },
  {
    topic: cleanTeamsMembersTopic,
    worker: cleanTeamsMembers,
    description: `Supprime les membres expirés des équipes incubateurs`,
  },
  {
    topic: syncMattermostUsersTopic,
    worker: syncMattermostUsers,
    description: `Synchronise les utilisateurs Mattermost avec la table mattermost_member_infos`,
  },
  {
    topic: deleteMatomoAccountTopic,
    worker: deleteMatomoAccountWorker,
    description: `Supprime les comptes Matomo des membres expirés (30 jours)`,
  },
  {
    topic: deleteSentryAccountTopic,
    worker: deleteSentryAccountWorker,
    description: `Supprime les comptes Sentry des membres expirés (30 jours)`,
  },
  {
    topic: syncMatomoAccountsTopic,
    worker: syncMatomoAccountsWorker,
    description: `Synchronise les comptes Matomo des membres actifs`,
  },
  {
    topic: syncSentryAccountsTopic,
    worker: syncSentryAccountsWorker,
    description: `Synchronise les comptes Sentry des membres actifs`,
  },
  {
    topic: unblockBlacklistedEmailsTopic,
    worker: unblockBlacklistedEmails,
    description: `Débloque les emails blacklistés de la liste Brevo MAILING_LIST_NEWSLETTER`,
  },
  {
    topic: recreateEmailIfUserActiveTopic,
    worker: recreateEmailIfUserActiveWorker,
    description: `Recrée les emails pour les utilisateurs redevenus actifs`,
  },
  {
    topic: sendEmailToStartupToUpdatePhaseTopic,
    worker: sendEmailToStartupToUpdatePhaseWorker,
    description: `Envoie par mail une relance pour mise à jour de la phase de la SE`,
  },
];

// We force using a singleton getter because if `.start()` is not called before doing any operation it will
// fail silently without doing/throwing anything (we also start listening for events before pushing them)
export async function startBossClientInstance(): Promise<PgBoss> {
  return await getBossClientInstance(async () => {
    for (const job of pgBossWorker) {
      await bossClient.work(job.topic, handlerWrapper(job.worker));
    }
    console.log(
      `Setup ${pgBossWorker.length} workers :\n${pgBossWorker
        .map((job) => job.topic)
        .join("\n")}`,
    );
  });
}

export async function stopBossClientInstance(): Promise<void> {
  if (initPromise) {
    await bossClient.stop({
      // add this to destroy connection at the end of tests
      graceful: process.env.NODE_ENV === "test" ? false : true,
      destroy: true,
    });
  }
}

export function handlerWrapper<ReqData>(
  handler: PgBoss.WorkHandler<ReqData>,
): PgBoss.WorkHandler<ReqData> {
  return async (job: PgBoss.Job<ReqData>) => {
    try {
      await handler(job);
    } catch (error) {
      console.error(error);

      Sentry.withScope(function (scope) {
        // Gather retry errors for the same event at the same place in Sentry
        scope.setFingerprint(["pgboss", job.id]);

        Sentry.captureException(error);
      });

      // Forward the error so pg-boss handles the error correctly
      throw error;
    }
  };
}
