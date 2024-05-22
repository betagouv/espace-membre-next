import { sql, ExpressionBuilder } from "kysely";

import { DB } from "@/@types/db"; // generated with `npm run kysely-codegen`
import { db, jsonArrayFrom } from "@/lib/kysely";

/** Return all startups */
export function getAllStartups() {
    return db.selectFrom("startups").selectAll().execute();
}

type GetUserInfosParams = {
    username: string;
    options?: { withDetails: boolean };
};
/** Return all startups */
export async function getStartup(uuid: string) {
    const startups = await db
        .selectFrom("startups")
        .selectAll()
        .where("startups.uuid", "=", uuid)
        .execute();
    return (startups.length && startups[0]) || undefined;
}

/** Return all startups */
export async function getStartupDetails(uuid: string) {
    const startups = await db
        .selectFrom("startups")
        .select((eb) => [
            "startups.accessibility_status",
            "startups.analyse_risques",
            "startups.analyse_risques_url",
            "startups.contact",
            "startups.content_url_encoded_markdown",
            "startups.current_phase",
            "startups.current_phase_date",
            "startups.dashlord_url",
            "startups.github",
            "startups.has_coach",
            "startups.has_intra",
            "startups.id",
            "startups.incubator",
            "startups.incubator_id",
            "startups.last_github_update",
            "startups.last_github_update",
            "startups.link",
            "startups.mailing_list",
            "startups.stats_url",
            "startups.stats",
            "startups.name",
            "startups.nb_total_members",
            "startups.nb_active_members",
            "startups.phases",
            "startups.pitch",
            "startups.repository",
            "startups.uuid",
            "startups.website",
            withMembers(eb),
        ])
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

/** Return member informations */
export async function getUserInfo(username: string) {
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
        ])
        .where("users.username", "=", username)
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
