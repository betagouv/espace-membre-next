import { sql, ExpressionBuilder } from "kysely";

import { DB } from "@/@types/db"; // generated with `npm run kysely-codegen`
import { db, jsonArrayFrom } from "@/lib/kysely";

/** Return all teams */
export function getAllTeams() {
    return db.selectFrom("teams").selectAll().execute();
}

/** Return all teams */
export async function getAllTeamsOptions() {
    const teams = await getAllTeams();
    return teams.map((team) => ({
        value: team.uuid,
        label: `${team.name}`,
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
