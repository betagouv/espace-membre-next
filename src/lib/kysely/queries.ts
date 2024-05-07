import { sql, ExpressionBuilder } from "kysely";

import { DB } from "@/@types/db"; // generated with `npm run kysely-codegen`
import { db, jsonArrayFrom } from "@/lib/kysely";

function withMissionStartups(eb: ExpressionBuilder<DB, "missions">) {
    return jsonArrayFrom(
        eb
            .selectFrom("startups")
            .leftJoin(
                "missions_startups",
                "missions_startups.startup_id",
                "startups.uuid"
            )
            .leftJoin(
                "missions as missions2",
                "missions.uuid",
                "missions_startups.mission_id"
            )
            .select("startups.id")
            .whereRef("missions2.uuid", "=", "missions.uuid")
            .orderBy("startups.id")
    ).as("startups");
}

function withMissions(eb: ExpressionBuilder<DB, "users">) {
    return jsonArrayFrom(
        eb
            .selectFrom("missions")
            .select((eb2) => [
                "missions.uuid",
                "missions.start",
                "missions.end",
                "missions.employer",
                "missions.role",
                "missions.status",
                // aggregate startups
                withMissionStartups(eb2),
            ])
            .whereRef("missions.user_id", "=", "users.uuid")
            .orderBy("missions.start")
    ).as("missions");
}

/** Compute member end date */
function withEndDate(eb: ExpressionBuilder<DB, "users">) {
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

/** Return all startups */
export function getAllStartups() {
    return db.selectFrom("startups").selectAll().execute();
}

/** Return member public informations */
export async function getUserInfo(username: string) {
    const query = db
        .selectFrom("users")
        .select((eb) => [
            "users.username",
            "users.fullname",
            "users.role",
            "users.domaine",
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
    console.log(query);
    const userInfos = await db.executeQuery(query);
    return (userInfos.rows.length && userInfos.rows[0]) || undefined;
}
