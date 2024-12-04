import { Selectable } from "kysely";

import { sentryUserSchemaType } from "../sentry";
import { ACCOUNT_SERVICE_STATUS } from "../services";
import { ServiceAccounts } from "@/@types/db";
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
        status: ACCOUNT_SERVICE_STATUS.ACCOUNT_FOUND,
    };
};

export const sentryServiceInfoToModel = (
    sentryUser: Selectable<ServiceAccounts>
): sentryUserSchemaType => {
    return {
        account_type: "sentry",
        email: sentryUser.email || "",
        service_user_id: sentryUser.service_user_id,
        metadata: (sentryUser.metadata || {
            teams: [],
        }) as sentryUserSchemaType["metadata"],
        status:
            (sentryUser.status as ACCOUNT_SERVICE_STATUS) ||
            ACCOUNT_SERVICE_STATUS.ACCOUNT_FOUND,
    };
};
