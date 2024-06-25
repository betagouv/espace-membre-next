import {
    sql,
    ExpressionBuilder,
    Kysely,
    SelectQueryBuilder,
    SelectExpression,
    ExpressionWrapper,
    Expression,
} from "kysely";
import { UpdateObjectExpression } from "kysely/dist/cjs/parser/update-set-parser";

import { DB } from "@/@types/db"; // generated with `npm run kysely-codegen`
import { db as database, jsonArrayFrom } from "@/lib/kysely";

const MEMBER_PROTECTED_INFO: SelectExpression<DB, "users">[] = [
    "users.uuid",
    "users.updated_at",
    "users.username",
    "users.fullname",
    "users.role",
    "users.domaine",
    "users.bio",
    "users.link",
    "users.github",
    "users.member_type",
    "users.primary_email",
    "users.secondary_email",
    "users.primary_email_status",
    "users.primary_email_status_updated_at",
    "users.communication_email",
    "users.email_is_redirection",
    "users.competences",
];

type GetUserInfosParams =
    | {
          username: string;
          options?: { withDetails: boolean };
      }
    | {
          uuid: string;
          options?: { withDetails: boolean };
      };
/** Return member informations */

export async function getUserInfos(
    params: GetUserInfosParams,
    db: Kysely<DB> = database
) {
    let query = db
        .selectFrom("users")
        // .leftJoin(
        //     "user_details",
        //     "user_details.hash",
        //     computeHash(params.username)
        // )
        .selectAll("users")
        .select((eb) => [withEndDate, withMissions]);
    // .$if(!!params.options?.withDetails, (qb) =>
    //     qb.leftJoin(
    //         "user_details",
    //         "user_details.hash",
    //         computeHash(params.username)
    //     ).
    // )
    if ("username" in params) {
        query = query.where("users.username", "=", params.username);
    } else {
        query = query.where("users.uuid", "=", params.uuid);
    }

    const userInfos = await db.executeQuery(query);

    return (userInfos.rows.length && userInfos.rows[0]) || undefined;
}

export async function getUserByStartup(
    startupUuid: string,
    db: Kysely<DB> = database
) {
    return (
        db
            .selectFrom("users")
            .select((eb) => [...MEMBER_PROTECTED_INFO, withMissions(eb)])
            .leftJoin("missions", "missions.user_id", "users.uuid")
            .leftJoin("missions_startups", "missions.uuid", "mission_id")
            .where("missions_startups.startup_id", "=", startupUuid)
            // .select((eb) => [
            //     "users.uuid",
            //     ...MEMBER_PROTECTED_INFO,
            //     // "users.username",
            //     // "users.fullname",
            //     // "users.role",
            //     // "users.domaine",
            //     // "users.bio",
            //     // "users.link",
            //     // "users.github",
            //     // "users.member_type",
            //     // "users.primary_email",
            //     // "users.secondary_email",
            //     // "users.primary_email_status",
            //     // "primary_email_status_updated_at",
            //     // "users.communication_email",
            //     // "users.email_is_redirection",
            //     withMissions(eb),
            // ])
            .execute()
    );
}

/** Return member informations */
export async function getUserBasicInfo(
    params: { username: string } | { uuid: string },
    db: Kysely<DB> = database
) {
    let query = db
        .selectFrom("users")
        .select((eb) => [...MEMBER_PROTECTED_INFO, withMissions(eb)]);

    if ("username" in params) {
        query = query.where("users.username", "=", params.username);
    } else {
        query = query.where("users.uuid", "=", params.uuid);
    }

    const userInfos = await db.executeQuery(query);

    return (userInfos.rows.length && userInfos.rows[0]) || undefined;
}

/** Return member informations */
export async function getAllUsersInfo(db: Kysely<DB> = database) {
    const query = db
        .selectFrom("users")
        .select((eb) => [...MEMBER_PROTECTED_INFO, withMissions(eb)])
        .compile();

    const userInfos = await db.executeQuery(query);

    return userInfos.rows;
}

// get list of startups with latest phase
const getSesWithLatestPhaseQuery = (db: Kysely<DB> = database) =>
    db
        .with("latest_phases", (db) =>
            // compute SES latest phase
            db
                .selectFrom("phases")
                .select((eb) => [
                    "startup_id",
                    "name",
                    "start",
                    "end",
                    sql<number>`ROW_NUMBER() OVER (PARTITION BY startup_id ORDER BY "end" DESC NULLS FIRST, start desc)`.as(
                        "rn"
                    ),
                ])
        )
        .selectFrom("latest_phases")
        .where("latest_phases.rn", "=", 1)
        .orderBy("start", "desc");

// search and get users public info
export async function searchUsers(
    filters: URLSearchParams,
    db: Kysely<DB> = database
) {
    // todo
    const startupPhases =
        filters.get("startupPhases")?.split(",").filter(Boolean) || [];

    const validStartups: string[] = [];
    if (startupPhases.length) {
        // select appropriate SES before-hand
        const ses = await getSesWithLatestPhaseQuery()
            .select("startup_id")
            .where("latest_phases.name", "in", startupPhases)
            .execute();
        validStartups.push(...ses.map((s) => s.startup_id));
    }

    const query = db
        .with("users_expiry", (db) => {
            return db
                .selectFrom("missions")
                .select((eb) => [
                    "user_id",
                    sql<boolean>`MAX(COALESCE(missions.end, '2200-02-02'))<=NOW()`.as(
                        "expired"
                    ),
                ])
                .groupBy("missions.user_id");
        })
        .selectFrom("users_expiry")
        .leftJoin("users", "users.uuid", "users_expiry.user_id")
        .leftJoin("missions", "missions.user_id", "users.uuid")
        .leftJoin(
            "missions_startups",
            "missions_startups.mission_id",
            "missions.uuid"
        )
        .leftJoin("startups", "startups.uuid", "missions_startups.startup_id")
        .select(({ eb, selectFrom }) => [
            ...MEMBER_PROTECTED_INFO, // aggregate startups names
            sql<
                Array<string>
            >`array_agg(startups.name order by startups.name)`.as("startups"),
        ])
        .where(({ eb, ref }) => {
            const conditions: Expression<any>[] = [];
            const domaines =
                filters.get("domaines")?.split(",").filter(Boolean) || [];
            const incubators =
                filters.get("incubators")?.split(",").filter(Boolean) || [];

            const memberStatus =
                filters.get("memberStatus")?.split(",").filter(Boolean) || [];
            const startups =
                filters.get("startups")?.split(",").filter(Boolean) || [];
            const competences =
                filters.get("competences")?.split(",").filter(Boolean) || [];
            if (domaines.length) {
                conditions.push(eb("domaine", "in", domaines));
            }
            if (incubators.length) {
                conditions.push(eb("startups.incubator_id", "in", incubators));
            }
            if (startups.length) {
                conditions.push(eb("startups.uuid", "in", startups));
            }
            if (competences.length) {
                // https://www.postgresql.org/docs/9.5/functions-json.html
                conditions.push(
                    eb(ref("competences"), "?&", eb.val(competences))
                );
            }
            if (validStartups.length) {
                conditions.push(eb("startups.uuid", "in", validStartups));
            }

            if (memberStatus.length) {
                const expiredStatus: boolean[] = [];
                if (memberStatus.includes("active")) {
                    expiredStatus.push(false);
                }
                if (memberStatus.includes("unactive")) {
                    expiredStatus.push(true);
                }
                conditions.push(
                    eb.or(expiredStatus.map((s) => eb("expired", "is", s)))
                );
            }

            return eb.and(conditions);
        })
        .groupBy([...MEMBER_PROTECTED_INFO])
        .orderBy(["users.fullname"])
        .compile();

    //console.log(query.sql);
    const userInfos = await db.executeQuery(query);

    return userInfos.rows;
}

// get all data even private info
export async function adminGetAllUsersInfos(db: Kysely<DB> = database) {
    let query = db
        .selectFrom("users")
        // .leftJoin(
        //     "user_details",
        //     "user_details.hash",
        //     computeHash(params.username)
        // )
        .selectAll("users")
        .select((eb) => [withEndDate, withMissions]);
    // .$if(!!params.options?.withDetails, (qb) =>
    //     qb.leftJoin(
    //         "user_details",
    //         "user_details.hash",
    //         computeHash(params.username)
    //     ).
    // )

    const userInfos = await db.executeQuery(query);

    return userInfos.rows;
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
            .selectFrom(["missions"])
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
            .select((eb2) => [
                "missions.uuid",
                "missions.start",
                "missions.end",
                "missions.employer",
                "missions.status",
                "missions.id",
                "missions.user_id",
                // aggregate startups names
                sql<
                    Array<string>
                >`coalesce(array_agg(startups.uuid order by startups.name) filter (where startups.uuid is not null), '{}')`.as(
                    "startups"
                ),
            ])
            .whereRef("missions.user_id", "=", "users.uuid")
            // .whereRef("missions.uuid", "=", "missions_startups.mission_id")
            .orderBy("missions.start", "asc")
            .groupBy("missions.uuid")
    ).as("missions");
}

/** Compute member end date */
function withEndDate(
    eb: ExpressionBuilder<DB, "users">,
    db: Kysely<DB> = database
) {
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

export async function updateUser(
    uuid: string,
    userData: UpdateObjectExpression<DB, "users">,
    db: Kysely<DB> = database
): Promise<number> {
    // Insert or update the mission and return the mission ID
    const result = await db
        .updateTable("users")
        .where("uuid", "=", uuid)
        .set(userData)
        .execute();

    if (!result) {
        throw new Error("Failed to insert or update mission");
    }

    return result.length;
}
