import { template } from "lodash";

import { sentryUserSchemaType } from "../sentry";
import { SentryUser, SentryUserAccess, SentryTeam } from "@/lib/sentry";

export const sentryUserToModel = (
    sentryUser: SentryUser,
    userMetadata: SentryUserAccess,
    allTeams: SentryTeam[]
): sentryUserSchemaType => {
    const teams: sentryUserSchemaType["metadata"]["teams"] = [];

    if (userMetadata) {
        userMetadata.teams.forEach((u) => {
            const team = allTeams.find((team) => u.includes(team.slug));
            if (team) {
                const role = userMetadata.teamRoles.find(
                    (t) => t.teamSlug === team.slug
                )?.role;
                teams.push({
                    id: team.id,
                    role: role
                        ? role
                        : userMetadata.role === "admin"
                        ? "admin"
                        : "contributor",
                    slug: team.slug,
                    name: team.name,
                    memberCount: team.memberCount,
                    projects: team.projects.map((p) => ({
                        id: p.id,
                        slug: p.slug,
                        name: p.name,
                        plateform: p.plateform,
                    })),
                });
            }
        });
    }
    return {
        email: sentryUser.email,
        account_type: "sentry",
        service_user_id: sentryUser.id,
        metadata: {
            teams,
            organisationRole: userMetadata.role,
            pending: userMetadata.pending,
            expired: userMetadata.expired,
            inviteStatus: userMetadata.inviteStatus,
        },
    };
};
