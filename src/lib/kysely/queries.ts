import { sql, ExpressionBuilder } from "kysely";

import { DB } from "@/@types/db"; // generated with `npm run kysely-codegen`
import { db, jsonArrayFrom } from "@/lib/kysely";

/** Return all startups */
export function getAllStartups() {
    return db.selectFrom("startups").selectAll().execute();
}

/** Return member informations */
export async function getUserDetails(username: string) {
    const query = db
        .selectFrom("users")
        .select((eb) => [
            "users.username",
            "users.fullname",
            "users.role",
            "users.domaine",
            "users.bio",
            "users.link",
            "users.primary_email",
            "users.secondary_email",
            "users.primary_email_status",
            // aggregate missions and startups
            withMissions(eb),
            // compute end date
            withEndDate(eb),
        ])
        .where("users.username", "=", username)
        .compile();

    //console.log(query.sql);

    const userInfos = await db.executeQuery(query);

    return (userInfos.rows.length && userInfos.rows[0]) || undefined;
}

/* UTILS */

function withMissions(eb: ExpressionBuilder<DB, "users">) {
    return jsonArrayFrom(
        eb
            .selectFrom(["missions", "startups"])
            .leftJoin(
                "missions_startups",
                "missions_startups.startup_id",
                "startups.uuid"
            )
            .select((eb2) => [
                "missions.uuid",
                "missions.start",
                "missions.end",
                "missions.employer",
                "missions.status",
                // aggregate startups names
                sql<
                    Array<string>
                >`array_agg(startups.uuid order by startups.name)`.as(
                    "startups"
                ),
            ])
            .whereRef("missions.user_id", "=", "users.uuid")
            .whereRef("missions.uuid", "=", "missions_startups.mission_id")
            .orderBy("missions.start", "asc")
            .groupBy("missions.uuid")
    ).as("missions");
}

/** Compute member end date */
function withEndDate(eb: ExpressionBuilder<DB, "users">) {
    // return MAX(missions.end) if there is no superior start date. NULL otherwise.
    return eb
        .selectFrom("missions")
        .select((eb2) => [
            sql`(SELECT CASE 
                    WHEN max(missions.start) > MAX(missions.end) THEN 
                        NULL
                    ELSE
                        MAX(missions.end) 
                    END
                    from missions where missions.end IS NOT NULL and missions.user_id=users.uuid)`.as(
                "end"
            ),
        ])
        .limit(1)
        .as("end");
}
