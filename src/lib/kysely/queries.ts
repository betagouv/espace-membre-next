import { sql, ExpressionBuilder } from "kysely";

import { DB, MissionsStatusEnum } from "@/@types/db"; // generated with `npm run kysely-codegen`
import { db, jsonArrayFrom } from "@/lib/kysely";

import { computeHash } from "@/utils/member";
import { Mission } from "@/models/mission";
import { DomaineSchemaType } from "@/models/member";

/** Return all startups */
export function getAllStartups() {
    return db.selectFrom("startups").selectAll().execute();
}

type GetUserInfosParams = {
    username: string;
    options?: { withDetails: boolean };
};

/** Return member informations */
export async function getUserInfos(params: GetUserInfosParams) {
    const query = db
        .selectFrom("users")
        // .leftJoin(
        //     "user_details",
        //     "user_details.hash",
        //     computeHash(params.username)
        // )
        .selectAll("users")
        .select((eb) => [withEndDate, withMissions])
        // .$if(!!params.options?.withDetails, (qb) =>
        //     qb.leftJoin(
        //         "user_details",
        //         "user_details.hash",
        //         computeHash(params.username)
        //     ).
        // )

        .where("users.username", "=", params.username)
        .compile();

    //console.log(query.sql);

    const userInfos = await db.executeQuery(query);

    return (userInfos.rows.length && userInfos.rows[0]) || undefined;
}

/* UTILS */

function withUserDetails(eb: ExpressionBuilder<DB, "user_details">) {
    return eb
        .selectFrom("user_details")
        .selectAll()
        .whereRef("user_details.hash", "=", sql.val<string>("xx"))
        .as("details");
}

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
            sql<null | Date>`(SELECT CASE 
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
