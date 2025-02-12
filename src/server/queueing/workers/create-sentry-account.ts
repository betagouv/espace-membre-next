import PgBoss from "pg-boss";

import { addEvent } from "@/lib/events";
import { db } from "@/lib/kysely";
import { userAlreadyHaveDefinedRoleOrTeamDoesNotExist } from "@/lib/sentry";
import { EventCode } from "@/models/actionEvent";
import { CreateSentryAccountDataSchemaType } from "@/models/jobs/services";
import { ACCOUNT_SERVICE_STATUS, SERVICES } from "@/models/services";
import { sentryClient } from "@/server/config/sentry.config";

export const createSentryServiceAccountTopic = "create-sentry-service-account";

export async function createSentryServiceAccount(
    job: PgBoss.Job<CreateSentryAccountDataSchemaType>
) {
    console.log(
        `Create sentry service account for ${job.data.email}`,
        job.id,
        job.name
    );
    const allSentryUsers = await sentryClient.getAllUsers();
    const existingUser = allSentryUsers.find(
        (sentryUser) => sentryUser.user.email === job.data.email
    );
    let serviceUserId: string;
    if (existingUser) {
        console.log("sentry user already exists");
        serviceUserId = existingUser.serviceUserId;
    } else {
        const user = await sentryClient.addUserToOrganization({
            email: job.data.email,
            orgRole: "member",
            teamRoles: job.data.teams,
        });
        serviceUserId = user.id;
    }
    for (const team of job.data.teams) {
        try {
            await sentryClient.changeMemberRoleInTeam({
                memberId: serviceUserId,
                teamRole: "admin",
                teamSlug: team.teamSlug,
            });
        } catch (error) {
            if (error === userAlreadyHaveDefinedRoleOrTeamDoesNotExist) {
                console.log("User already has the expected rights");
            } else {
                throw error;
            }
        }
    }
    await db
        .updateTable("service_accounts")
        .set({
            service_user_id: serviceUserId,
            status: ACCOUNT_SERVICE_STATUS.ACCOUNT_INVITATION_SENT,
        })
        .where("account_type", "=", SERVICES.SENTRY)
        .where("user_id", "=", job.data.userUuid)
        .execute();
    await addEvent({
        action_code: EventCode.MEMBER_SERVICE_ACCOUNT_CREATED,
        action_metadata: {
            service: SERVICES.SENTRY,
            teams: job.data.teams,
            requestId: job.data.requestId,
        },
        action_on_username: job.data.username,
        created_by_username: job.data.username,
    });

    console.log(`the sentry account has been created for ${job.data.username}`);
}
