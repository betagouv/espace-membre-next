import { sql, ExpressionBuilder } from "kysely";

import { DB } from "@/@types/db"; // generated with `npm run kysely-codegen`
import { db, jsonArrayFrom } from "@/lib/kysely";

/** Return all incubators */
export function getAllIncubators() {
    return db.selectFrom("incubators").selectAll().execute();
}

/** Return all incubators */
export async function getAllIncubatorsOptions() {
    const incubs = await getAllIncubators();
    return incubs.map((incub) => ({
        value: incub.uuid,
        label: `${incub.title} ${incub.ghid ? `(${incub.ghid})` : ""}`,
    }));
}

/** Return all incubators */
export async function getIncubator(uuid: string) {
    return await db
        .selectFrom("incubators")
        .selectAll()
        .where("uuid", "=", uuid)
        .executeTakeFirst();
}

export async function getAllIncubatorsMembers() {
    const incubs = await getAllIncubators();
    return Promise.all(
        incubs.map(async (incub) => {
            const teamMembers = await db
                .selectFrom("users")
                .select(["users.uuid", "users.fullname"])
                .leftJoin("users_teams", "users_teams.user_id", "users.uuid")
                .leftJoin("teams", "teams.uuid", "users_teams.team_id")
                .leftJoin("incubators", "teams.incubator_id", "incubators.uuid")
                .where("teams.incubator_id", "=", incub.uuid)
                .execute();
            const startupMembers = await db
                .selectFrom("users")
                .select(["users.uuid", "users.fullname"])
                .leftJoin("missions", "missions.user_id", "users.uuid")
                .leftJoin(
                    "missions_startups",
                    "missions_startups.mission_id",
                    "missions.uuid"
                )
                .leftJoin(
                    "startups",
                    "startups.uuid",
                    "missions_startups.startup_id"
                )
                .where("startups.incubator_id", "=", incub.uuid)
                .execute();
            return {
                // ...incub,
                id: incub.uuid,
                title: incub.title,
                members: [...teamMembers, ...startupMembers],
            };
        })
    );
}
