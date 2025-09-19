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
  updateSentryServiceAccount,
  updateSentryServiceAccountTopic,
} from "./workers/update-sentry-account";
import {
  createDimailMailbox,
  createDimailMailboxTopic,
} from "./workers/create-dimail-mailbox";
import { BusinessError, ErrorWithStatus } from "@/utils/error";
import { gracefulExit } from "@/utils/gracefulExit";
import {
  sendNewMemberVerificationEmail,
  sendNewMemberVerificationEmailTopic,
} from "./workers/send-verification-email";

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
    description: `Envoie un email aux membres de la startup d'un nouveau membre pour qu'il valide sa fiche`,
  },
  {
    topic: sendNewMemberVerificationEmailTopic,
    worker: sendNewMemberVerificationEmail,
    description: `Envoie un email de validation pour un nouveau membre`,
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
