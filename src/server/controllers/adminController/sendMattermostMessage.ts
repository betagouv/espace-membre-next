import { db } from "@/lib/kysely";
import { MattermostUser } from "@/lib/mattermost";
import { EmailStatusCode } from "@/models/member";
import config from "@/server/config";
import { getUserWithParams, sendInfoToChat } from "@infra/chat";

export const getMattermostUsers = async ({
    fromBeta,
    includeEmails,
    excludeEmails,
}: {
    fromBeta: boolean;
    includeEmails: string[];
    excludeEmails: string[];
}) => {
    let activeUsers = await getUserWithParams({
        params: {
            in_team: config.mattermostTeamId,
            active: true,
        },
    });
    if (includeEmails && includeEmails.length) {
        activeUsers = activeUsers.filter((user) =>
            includeEmails.includes(user.email),
        );
    }
    if (excludeEmails && excludeEmails.length) {
        activeUsers = activeUsers.filter(
            (user) => !excludeEmails.includes(user.email),
        );
    }
    if (fromBeta) {
        const dbUsers = await db
            .selectFrom("users")
            .selectAll()
            .where("primary_email_status", "in", [
                EmailStatusCode.EMAIL_ACTIVE,
                EmailStatusCode.EMAIL_ACTIVE_AND_PASSWORD_DEFINITION_PENDING,
            ])
            .execute();
        const primaryEmails = dbUsers
            .map((user) => user.primary_email)
            .filter((email) => email);
        const secondaryEmails = dbUsers
            .map((user) => user.secondary_email)
            .filter((email) => email);
        const emails = [...primaryEmails, ...secondaryEmails];
        activeUsers = activeUsers.filter((user) => emails.includes(user.email));
    }
    return activeUsers;
};
