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

export function getTeamsForIncubator(incubatorId: string) {
    return db
        .selectFrom("teams")
        .selectAll()
        .where("incubator_id", "=", incubatorId)
        .execute();
}

export function getIncubatorTeamMembers(incubatorId: string) {
    const today = new Date();
    return db
        .selectFrom("users")
        .innerJoin("users_teams", "users.uuid", "users_teams.user_id")
        .innerJoin("teams", "users_teams.team_id", "teams.uuid")
        .innerJoin("incubators", "teams.incubator_id", "incubators.uuid")
        .leftJoin(
            (eb) =>
                eb
                    .selectFrom("missions")
                    .distinctOn("user_id") // Ensures only one row per user
                    .select(["user_id", "end", "start"])
                    .where("start", "<=", today)
                    .where("end", ">=", today)
                    .orderBy(["user_id", "end desc"]) // Sort per user, picking the latest
                    .as("latest_missions"),
            (join) => join.onRef("latest_missions.user_id", "=", "users.uuid"),
        )
        .where("latest_missions.end", ">=", today)
        .where("teams.incubator_id", "=", incubatorId)
        .select([
            "users.uuid",
            "users.primary_email",
            "users.fullname",
            "users.username",
            "users.email_verified",
            "users.role",
            "users.avatar",
            "teams.name as team_name",
        ])
        .execute();
}
