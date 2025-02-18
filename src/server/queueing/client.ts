import * as Sentry from "@sentry/nextjs";
import PgBoss from "pg-boss";

import {
    createSentryServiceAccount,
    createSentryServiceAccountTopic,
} from "./workers/create-sentry-account";
import {
    createOrUpdateMatomoServiceAccount,
    createOrUpdateMatomoServiceAccountTopic,
} from "./workers/create-update-matomo-account";
import {
    sendNewMemberValidationEmail,
    sendNewMemberValidationEmailTopic,
} from "./workers/send-validation-email";
import {
    updateSentryServiceAccount,
    updateSentryServiceAccountTopic,
} from "./workers/update-sentry-account";
import { BusinessError, ErrorWithStatus } from "@/utils/error";
import { gracefulExit } from "@/utils/gracefulExist";

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
    callback?: () => void
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

// We force using a singleton getter because if `.start()` is not called before doing any operation it will
// fail silently without doing/throwing anything (we also start listening for events before pushing them)
export async function startBossClientInstance(): Promise<PgBoss> {
    return await getBossClientInstance(async () => {
        await bossClient.work(
            createOrUpdateMatomoServiceAccountTopic,
            handlerWrapper(createOrUpdateMatomoServiceAccount)
        );
        await bossClient.work(
            createSentryServiceAccountTopic,
            handlerWrapper(createSentryServiceAccount)
        );
        await bossClient.work(
            updateSentryServiceAccountTopic,
            handlerWrapper(updateSentryServiceAccount)
        );
        await bossClient.work(
            sendNewMemberValidationEmailTopic,
            handlerWrapper(sendNewMemberValidationEmail)
        );
        // cron tasks
        await bossClient.schedule(
            sendEmailToTeamsToCheckOnTeamComposition,
            `0 3 * * *`,
            undefined,
            { tz: "Europe/Paris" }
        ); // At night to save performance
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
    handler: PgBoss.WorkHandler<ReqData>
): PgBoss.WorkHandler<ReqData> {
    return async (job: PgBoss.Job<ReqData>) => {
        try {
            await handler(job);
        } catch (error) {
            console.error(error);

            // Wrapping to report error is required since there is no working way to watch job changes easily with `work()` method
            // Ref: https://github.com/timgit/pg-boss/issues/273#issuecomment-1788162895
            if (
                !(error instanceof ErrorWithStatus) ||
                !(error instanceof BusinessError)
            ) {
                Sentry.withScope(function (scope) {
                    // Gather retry errors for the same event at the same place in Sentry
                    scope.setFingerprint(["pgboss", job.id]);

                    Sentry.captureException(error);
                });
            }

            // Forward the error so pg-boss handles the error correctly
            throw error;
        }
    };
}
