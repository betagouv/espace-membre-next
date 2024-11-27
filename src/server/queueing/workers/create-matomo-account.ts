import pAll from "p-all";
import PgBoss from "pg-boss";

import { db } from "@/lib/kysely";
import { CreateMatomoAccountDataSchemaType } from "@/models/jobs/services";
import { matomoMetadataToModel } from "@/models/mapper/matomoMapper";
import { ACCOUNT_SERVICE_STATUS, SERVICES } from "@/models/services";
import { matomoClient } from "@/server/config/matomo.config";
import { decryptPassword } from "@/server/controllers/utils";

export const createMatomoServiceAccountTopic = "create-matomo-service-account";

export async function createMatomoServiceAccount(
    job: PgBoss.Job<CreateMatomoAccountDataSchemaType>
) {
    console.log(
        `Create matomo service account for ${job.data.login}`,
        job.id,
        job.name
    );

    // throw new Error("Account could not be created");
    const userLogin = job.data.email;

    await matomoClient.createUser({
        email: job.data.email,
        password: decryptPassword(job.data.password),
        userLogin,
        alias: job.data.email,
    });

    const idSites: number[] = [];
    await pAll(
        job.data.sites.map((s) => async () => {
            const siteId = await matomoClient.getSiteOrCreate(s.url, [s.url]);
            idSites.push(siteId);
        })
    );
    await matomoClient.grantUserAccess({
        userLogin,
        idSites: idSites,
        access: "admin",
    });
    const allWebsites = await matomoClient.getAllSites();
    const userMetadata = await matomoClient.fetchUserAccess(job.data.email);
    const metadata = matomoMetadataToModel(userMetadata, allWebsites);
    const result = await db
        .updateTable("service_accounts")
        .where("account_type", "=", SERVICES.MATOMO)
        .where("email", "=", job.data.email)
        .set({
            service_user_id: userLogin,
            status: ACCOUNT_SERVICE_STATUS.ACCOUNT_FOUND,
            metadata: JSON.stringify(metadata),
        })
        .executeTakeFirstOrThrow();

    console.log(`the matomo account has been created for ${userLogin}`);
}
