import pAll from "p-all";
import PgBoss from "pg-boss";

import { addEvent } from "@/lib/events";
import { db } from "@/lib/kysely";
import { MatomoAccess } from "@/lib/matomo";
import { EventCode } from "@/models/actionEvent";
import { CreateOrUpdateMatomoAccountDataSchemaType } from "@/models/jobs/services";
import { matomoMetadataToModel } from "@/models/mapper/matomoMapper";
import { ACCOUNT_SERVICE_STATUS, SERVICES } from "@/models/services";
import { matomoClient } from "@/server/config/matomo.config";
import { decryptPassword } from "@/server/controllers/utils";

export const createOrUpdateMatomoServiceAccountTopic =
    "create-update-matomo-service-account";

export async function createOrUpdateMatomoServiceAccount(
    job: PgBoss.Job<CreateOrUpdateMatomoAccountDataSchemaType>
) {
    console.log(
        `Create or update matomo service account for ${job.data.login}`,
        job.id,
        job.name
    );

    let userLogin = job.data.email;
    const res = await matomoClient.getUserByEmail(job.data.email);
    let userExist = false;
    if ("login" in res && res.login) {
        userLogin = res.login;
        userExist = true;
    } else {
        if (
            res &&
            "result" in res &&
            res.result === "error" &&
            res.message.includes(`est inexistant.`)
        ) {
            await matomoClient.createUser({
                email: job.data.email,
                password: decryptPassword(job.data.password),
                userLogin,
                alias: job.data.email,
            });
        } else {
            console.error(`error`, res);
            throw new Error("UnexpectedError");
        }
    }
    const idSites: number[] = (job.data.sites || []).map((site) => site.id);
    if (job.data.newSite) {
        const siteId = await matomoClient.createSite(
            job.data.newSite.name || job.data.newSite.url,
            job.data.newSite.url ? [job.data.newSite.url] : [],
            job.data.newSite.type
        );
        console.log("LCS CREATE SITE", siteId, typeof siteId);
        idSites.push(siteId);
        await db
            .insertInto("matomo_sites")
            .values({
                startup_id: job.data.newSite.startupId,
                type: job.data.newSite.type,
                name: job.data.newSite.name || job.data.newSite.url,
                matomo_id: siteId,
                url: job.data.newSite.url,
            })
            .execute();
    }
    await matomoClient.grantUserAccess({
        userLogin,
        idSites: idSites,
        access: MatomoAccess.admin,
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
    const data = {
        action_metadata: {
            service: SERVICES.MATOMO,
            sites: (job.data.sites || []).map((s) => ({
                id: s.id,
                access: MatomoAccess.admin,
            })),
            newSite: job.data.newSite
                ? {
                      url: job.data.newSite.url,
                      name: job.data.newSite.name || job.data.newSite.url,
                      type: job.data.newSite.type,
                      access: MatomoAccess.admin,
                      startupId: job.data.newSite.startupId,
                  }
                : undefined,
            requestId: job.data.requestId,
        },
        action_on_username: job.data.username,
        created_by_username: job.data.username,
    };
    if (userExist) {
        // it raises typescript error when using un addEvent call, and :
        // action_code userExist ? EventCode.MEMBER_SERVICE_ACCOUNT_UPDATED : EventCode.MEMBER_SERVICE_ACCOUNT_CREATED
        await addEvent({
            ...data,
            action_code: EventCode.MEMBER_SERVICE_ACCOUNT_UPDATED,
            action_metadata: {
                ...data.action_metadata,
                service: SERVICES.MATOMO,
            },
        });
        console.log(`the matomo account has been update for ${userLogin}`);
    } else {
        await addEvent({
            ...data,
            action_code: EventCode.MEMBER_SERVICE_ACCOUNT_CREATED,
            action_metadata: {
                ...data.action_metadata,
                service: SERVICES.MATOMO,
            },
        });
        console.log(`the matomo account has been created for ${userLogin}`);
    }
}
