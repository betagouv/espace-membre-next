import pAll from "p-all";
import PgBoss from "pg-boss";

import { db } from "@/lib/kysely";
import { UpdateSentryAccountDataSchemaType } from "@/models/jobs/services";
import { ACCOUNT_SERVICE_STATUS, SERVICES } from "@/models/services";
import { sentryClient } from "@/server/config/sentry.config";
import { decryptPassword } from "@/server/controllers/utils";

export const updateSentryServiceAccountTopic = "update-sentry-service-account";

export async function updateSentryServiceAccount(
    job: PgBoss.Job<UpdateSentryAccountDataSchemaType>
) {
    console.log(
        `update sentry service account for ${job.data.username}`,
        job.id,
        job.name
    );
    await pAll(
        job.data.teams.map((t) => async () => {
            await sentryClient.addUserToTeam({
                memberId: job.data.memberId,
                teamSlug: t.teamSlug,
            });
            await sentryClient.changeMemberRoleInTeam({
                memberId: job.data.memberId,
                teamSlug: t.teamSlug,
                teamRole: t.teamRole,
            });
        })
    );
    const result = await db
        .updateTable("service_accounts")
        .set({
            service_user_id: job.data.memberId,
            status: ACCOUNT_SERVICE_STATUS.ACCOUNT_INVITATION_SENT,
        })
        .where("account_type", "=", SERVICES.SENTRY)
        .where("user_id", "=", job.data.userUuid)
        .executeTakeFirstOrThrow();

    console.log(`the sentry account has been updated for ${job.data.username}`);
}
