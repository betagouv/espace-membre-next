import { sql, ExpressionBuilder, Kysely, SelectExpression } from "kysely";
import { UpdateObjectExpression } from "kysely/dist/cjs/parser/update-set-parser";
import { DB } from "@/@types/db"; // generated with `npm run kysely-codegen`
import { db as database, jsonArrayFrom } from "@/lib/kysely";

export const MEMBER_PROTECTED_INFO: SelectExpression<DB, "users">[] = [
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

export async function getUserStartups(
    uuid: string,
    db: Kysely<DB> = database
): Promise<{ name: string | null; uuid: string | null }[]> {
    const result = await db
        .selectFrom("users")
        .leftJoin("missions", "missions.user_id", "users.uuid")
        .leftJoin(
            "missions_startups",
            "missions_startups.mission_id",
            "missions.uuid"
        )
        .leftJoin("startups", "startups.uuid", "missions_startups.startup_id")
        .select(["startups.uuid", "startups.name", "missions.start"])
        .distinct()
        .where("users.uuid", "=", uuid)
        .orderBy("missions.start", "desc")
        .execute();

    if (!result) {
        throw new Error("Failed to insert or update mission");
    }

    return result;
}
