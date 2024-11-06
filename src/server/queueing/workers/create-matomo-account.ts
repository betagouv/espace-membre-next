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

    const user = await matomoClient.createUser(
        job.data.email,
        decryptPassword(job.data.password),
        job.data.password,
        job.data.email
    );

    await pAll(
        job.data.sites.map((s) => async () => {
            const siteId = await matomoClient.getSiteOrCreate(s.url, [s.url]);
            await matomoClient.grantUserAccess(job.data.email, siteId, "admin");
        })
    );

    const allWebsites = await matomoClient.getAllSites();
    const userMetadata = await matomoClient.fetchUserAccess(job.data.email);
    const metadata = matomoMetadataToModel(userMetadata, allWebsites);
    const result = await db
        .updateTable("service_accounts")
        .set({
            service_user_id: user.login,
            status: ACCOUNT_SERVICE_STATUS.ACCOUNT_FOUND,
            metadata: JSON.stringify(metadata),
        })
        .executeTakeFirstOrThrow();

    console.log(`the user account has been created for the case`);
}
