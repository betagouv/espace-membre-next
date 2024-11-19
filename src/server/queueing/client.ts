import * as Sentry from "@sentry/nextjs";
import PgBoss from "pg-boss";

import {
    createMattermostServiceAccount,
    createMattermostServiceAccountTopic,
} from "./workers/create-mattermost-account";
import { gracefulExit } from "../system";
import { ErrorWithStatus } from "@/utils/error";

// It appears the PostgreSQL client for `pg-boss` acts differently than the `prisma` ORM one about SSL connection
// For now the only solution we found is to not check certificates because we had the following thrown from `bossClient.start()`:
//
// ```
// > curl http://localhost:$PORT/api/init
// Error: self signed certificate in certificate chain
// at TLSSocket._finishInit (node:_tls_wrap:946:8)
// at TLSSocket.onConnectSecure (node:_tls_wrap:1532:34)
// at TLSWrap.callbackTrampoline (node:internal/async_hooks:130:17) {
// at TLSWrap.ssl.onhandshakedone (node:_tls_wrap:727:12)
// }
// code: 'SELF_SIGNED_CERT_IN_CHAIN'
// at TLSSocket.emit (node:events:527:28)
// Failed to initialize some services
// ```
let databaseUrl = process.env.DATABASE_URL || "";
databaseUrl = databaseUrl.replace("sslmode=prefer", "sslmode=no-verify");
console.log("LCS TOTO", databaseUrl);
const bossClient = new PgBoss({
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

export async function getBossClientInstance(): Promise<PgBoss> {
    if (!initPromise) {
        initPromise = (async () => {
            await bossClient.start();
            console.log("LCS START BOSS CLIENT");
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
    if (!initPromise) {
        initPromise = (async () => {
            await bossClient.start();
            console.log("LCS START BOSS CLIENT");
            // Bind listeners
            await bossClient.work(
                createMattermostServiceAccountTopic,
                handlerWrapper(createMattermostServiceAccount)
            );
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

export async function stopBossClientInstance(): Promise<void> {
    if (initPromise) {
        await bossClient.stop();
    }
}

export function handlerWrapper<ReqData>(
    handler: PgBoss.WorkHandler<ReqData>
): PgBoss.WorkHandler<ReqData> {
    return async (job: PgBoss.Job<ReqData>) => {
        console.log("LCS JOB CALL");
        try {
            await handler(job);
        } catch (error) {
            console.error(error);

            // Wrapping to report error is required since there is no working way to watch job changes easily with `work()` method
            // Ref: https://github.com/timgit/pg-boss/issues/273#issuecomment-1788162895
            if (!(error instanceof ErrorWithStatus)) {
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
