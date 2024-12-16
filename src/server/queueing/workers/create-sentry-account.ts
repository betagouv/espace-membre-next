import pAll from "p-all";
import PgBoss from "pg-boss";

import { addEvent } from "@/lib/events";
import { db } from "@/lib/kysely";
import { SentryRole } from "@/lib/sentry";
import { EventCode } from "@/models/actionEvent";
import { CreateSentryAccountDataSchemaType } from "@/models/jobs/services";
import { ACCOUNT_SERVICE_STATUS, SERVICES } from "@/models/services";
import { sentryClient } from "@/server/config/sentry.config";
import { decryptPassword } from "@/server/controllers/utils";

export const createSentryServiceAccountTopic = "create-sentry-service-account";

export async function createSentryServiceAccount(
    job: PgBoss.Job<CreateSentryAccountDataSchemaType>
) {
    console.log(
        `Create sentry service account for ${job.data.email}`,
        job.id,
        job.name
    );

    const user = await sentryClient.addUserToOrganization({
        email: job.data.email,
        orgRole: "member",
        teamRoles: job.data.teams,
    });
    const result = await db
        .updateTable("service_accounts")
        .set({
            service_user_id: user.id,
            status: ACCOUNT_SERVICE_STATUS.ACCOUNT_INVITATION_SENT,
        })
        .where("account_type", "=", SERVICES.SENTRY)
        .where("user_id", "=", job.data.userUuid)
        .executeTakeFirstOrThrow();

    addEvent({
        action_code: EventCode.MEMBER_SERVICE_ACCOUNT_CREATED,
        action_metadata: {
            service: SERVICES.SENTRY,
            teams: job.data.teams,
        },
        action_on_username: job.data.username,
        created_by_username: job.data.username,
    });

    console.log(`the sentry account has been created for ${job.data.username}`);
}
