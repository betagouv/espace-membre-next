import { sql, ExpressionBuilder } from "kysely";

import { DB } from "@/@types/db"; // generated with `npm run kysely-codegen`
import { db, jsonArrayFrom } from "@/lib/kysely";

/** Return all teams */
export function getAllTeams() {
    return db.selectFrom("teams").selectAll().execute();
}

/** Return all teams */
export async function getAllTeamsOptions() {
    const teams = await db
        .selectFrom("teams")
        .innerJoin("incubators", "teams.incubator_id", "incubators.uuid")
        .select(["teams.uuid", "teams.name", "incubators.title"])
        .execute();
    return teams.map((team) => ({
        value: team.uuid,
        label: `${team.title} - ${team.name}`,
    }));
}

/** Return all teams */
export async function getTeam(uuid: string) {
    return await db
        .selectFrom("teams")
        .selectAll()
        .where("uuid", "=", uuid)
        .executeTakeFirst();
}

export function getTeamsForUser(userUuid: string) {
    return db
        .selectFrom("teams")
        .selectAll()
        .innerJoin("users_teams", "team_id", "teams.uuid")
        .where("user_id", "=", userUuid)
        .execute();
}
