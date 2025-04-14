import * as Sentry from "@sentry/node";
import { CronJob } from "cron";

import { db } from "@/lib/kysely";

const onTickWrapper = (
    name: string,
    onTick: Function,
    onComplete: Function,
    onError: Function
) => {
    console.log("Create ontick wrapper");
    return async function () {
        console.log(`Run ${name}`);
        try {
            await onTick();
            console.log(`Run  after on tick ${name}`);
            await onComplete();
            console.log(`Run  after on Complete ${name}`);
        } catch (e) {
            Sentry.captureException(e);
            await onError(e);
            // Job Failed unexpectedly
        }
    };
};

export function startJobs() {
    let activeJobs = 0;
    for (const job of jobs) {
        const cronjob: Job = { timeZone: "Europe/Paris", start: true, ...job };

        if (cronjob.isActive) {
            console.log(
                `🚀 The job "${cronjob.name}" is ON ${cronjob.cronTime}`
            );
            new CronJob({
                ...cronjob,
                onTick: onTickWrapper(
                    cronjob.name,
                    cronjob.onTick,
                    async function () {
                        const dbTaskSucceed: DBTaskInsertSucceed = {
                            name: cronjob.name,
                            description: cronjob.description,
                            updated_at: new Date(),
                            last_completed: new Date(),
                        };
                        await db
                            .insertInto("tasks")
                            .values(dbTaskSucceed)
                            .onConflict((eb) =>
                                eb.column("name").doUpdateSet({
                                    ...dbTaskSucceed,
                                })
                            )
                            .execute();
                        return;
                    },
                    async function (error) {
                        const dbTaskFailed: DBTaskInsertFailed = {
                            name: cronjob.name,
                            description: cronjob.description,
                            updated_at: new Date(),
                            last_failed: new Date(),
                            error_message: error.message,
                        };
                        await db
                            .insertInto("tasks")
                            .values(dbTaskFailed)
                            .onConflict((eb) =>
                                eb.column("name").doUpdateSet({
                                    ...dbTaskFailed,
                                })
                            )
                            .execute();
                        return;
                    }
                ),
            });
            activeJobs++;
        } else {
            console.log(`❌ The job "${cronjob.name}" is OFF`);
        }
    }

    console.log(`Started ${activeJobs} / ${jobs.length} cron jobs`);
}

startJobs();
