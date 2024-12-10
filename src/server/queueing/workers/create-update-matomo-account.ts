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
            throw new Error("UnexpectedError");
        }
    }
    const idSites: number[] = (job.data.sites || []).map((site) => site.id);
    if (job.data.newSites) {
        await pAll(
            job.data.newSites.map((s) => async () => {
                const siteId = await matomoClient.getSiteOrCreate(s.url, [
                    s.url,
                ]);
                idSites.push(siteId);
            })
        );
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
            newSites: (job.data.newSites || []).map((s) => ({
                url: s.url,
                access: MatomoAccess.admin,
            })),
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
