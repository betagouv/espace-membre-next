import { sql, ExpressionBuilder } from "kysely";

import { DB } from "@/@types/db"; // generated with `npm run kysely-codegen`
import { db, jsonArrayFrom } from "@/lib/kysely";

/** Return all startups */
export function getAllStartups() {
    return db.selectFrom("startups").selectAll().execute();
}

/** Return all startups */
export async function getStartup(uuid: string) {
    const startups = await db
        .selectFrom("startups")
        .selectAll()
        .where("startups.uuid", "=", uuid)
        .execute();
    return (startups.length && startups[0]) || undefined;
}

/* UTILS */

function withMembers(eb: ExpressionBuilder<DB, "startups">) {
    return jsonArrayFrom(
        eb
            .selectFrom(["missions"])
            .leftJoin(
                "missions_startups",
                "missions_startups.startup_id",
                "startups.uuid"
            )
            .leftJoin("users", "missions.user_id", "users.uuid")
            .select((eb2) => [
                "users.username",
                "users.domaine",
                "missions.end",
                "missions.start",
                // sql<
                //     Array<string>
                // >`array_agg(users.uuid order by users.username)`.as("users"),
            ])
            .whereRef("missions_startups.startup_id", "=", "startups.uuid")
            .whereRef("missions.uuid", "=", "missions_startups.mission_id")
        // .orderBy("missions.start", "asc")
        // .groupBy("missions.uuid")
        // .groupBy("users.username")
    ).as("members");
}
