import pAll from "p-all";
import PgBoss from "pg-boss";

import { db } from "@/lib/kysely";
import { CreateSentryAccountDataSchemaType } from "@/models/jobs/services";
import { sentryMetadataToModel } from "@/models/mapper/sentryMapper";
import { ACCOUNT_SERVICE_STATUS, SERVICES } from "@/models/services";
import { sentryClient } from "@/server/config/sentry.config";
import { decryptPassword } from "@/server/controllers/utils";

export const createSentryServiceAccountTopic = "create-sentry-service-account";

export async function createSentryServiceAccount(
    job: PgBoss.Job<CreateSentryAccountDataSchemaType>
) {
    console.log(
        `Create sentry service account for ${job.data.login}`,
        job.id,
        job.name
    );

    // throw new Error("Account could not be created");
    const userLogin = job.data.email;

    await sentryClient.createUser({
        email: job.data.email,
        password: decryptPassword(job.data.password),
        userLogin,
        alias: job.data.email,
        teams: [],
    });

    const result = await db
        .updateTable("service_accounts")
        .set({
            service_user_id: userLogin,
            status: ACCOUNT_SERVICE_STATUS.ACCOUNT_FOUND,
            metadata: JSON.stringify(metadata),
        })
        .executeTakeFirstOrThrow();

    console.log(`the sentry account has been created for ${userLogin}`);
}
