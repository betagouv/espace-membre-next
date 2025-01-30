import pAll from "p-all";
import PgBoss from "pg-boss";

import { addEvent } from "@/lib/events";
import { db } from "@/lib/kysely";
import { userNotFound } from "@/lib/sentry";
import { EventCode } from "@/models/actionEvent";
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
    let user;
    try {
        user = await sentryClient.fetchUserAccess(job.data.memberId);

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
        await sentryClient.regenerateInviteForUser({
            sentryUserId: job.data.memberId,
        });
        await db
            .updateTable("service_accounts")
            .set({
                service_user_id: job.data.memberId,
                status: ACCOUNT_SERVICE_STATUS.ACCOUNT_INVITATION_SENT,
            })
            .where("account_type", "=", SERVICES.SENTRY)
            .where("user_id", "=", job.data.userUuid)
            .executeTakeFirstOrThrow();

        await addEvent({
            action_code: EventCode.MEMBER_SERVICE_ACCOUNT_UPDATED,
            action_metadata: {
                service: SERVICES.SENTRY,
                teams: job.data.teams,
                requestId: job.data.requestId,
            },
            action_on_username: job.data.username,
            created_by_username: job.data.username,
        });
    } catch (e) {
        if (e === userNotFound) {
            console.error("This user does not exists");
            userDoesNoExist(job);
        } else {
            throw e;
        }
    }
    console.log(`the sentry account has been updated for ${job.data.username}`);
}

const userDoesNoExist = async (
    job: PgBoss.Job<UpdateSentryAccountDataSchemaType>
) => {
    // user has been deleted before the job calling the job
    await addEvent({
        action_code:
            EventCode.MEMBER_SERVICE_ACCOUNT_UPDATE_FAILED_USER_DOES_NOT_EXIST,
        action_metadata: {
            service: SERVICES.SENTRY,
            teams: job.data.teams,
            requestId: job.data.requestId,
        },
        action_on_username: job.data.username,
        created_by_username: job.data.username,
    });
};
