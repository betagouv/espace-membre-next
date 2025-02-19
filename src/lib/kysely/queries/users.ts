import { isAfter } from "date-fns/isAfter";
import { isBefore } from "date-fns/isBefore";
import { sql, ExpressionBuilder, Kysely, SelectExpression } from "kysely";
import { UpdateObjectExpression } from "kysely/dist/cjs/parser/update-set-parser";

import { DB } from "@/@types/db"; // generated with `npm run kysely-codegen`
import { db as database, jsonArrayFrom } from "@/lib/kysely";
import { EmailStatusCode } from "@/models/member";

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
] as const;

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
        .selectAll("users")
        .select((eb) => [withEndDate, withMissions, withTeams]);
    if ("username" in params) {
        query = query.where("users.username", "=", params.username);
    } else {
        query = query.where("users.uuid", "=", params.uuid);
    }

    const userInfos = await db.executeQuery(query);

    return (userInfos.rows.length && userInfos.rows[0]) || undefined;
}

export async function getUsersByStartup(
    startupUuid: string,
    db: Kysely<DB> = database
) {
    return protectedDataSelect(db)
        .select((eb) => [withMissions(eb), withTeams(eb)])
        .leftJoin("missions", "missions.user_id", "users.uuid")
        .leftJoin("missions_startups", "missions.uuid", "mission_id")
        .where("missions_startups.startup_id", "=", startupUuid)
        .execute();
}

/** Return member informations */
export async function getUserBasicInfo(
    params: { username: string } | { uuid: string },
    db: Kysely<DB> = database
) {
    let query = protectedDataSelect(db).select((eb) => [
        withMissions(eb),
        withTeams(eb),
    ]);

    if ("username" in params) {
        query = query.where("users.username", "=", params.username);
    } else {
        query = query.where("users.uuid", "=", params.uuid);
    }

    const userInfos = await db.executeQuery(query);

    return (userInfos.rows.length && userInfos.rows[0]) || undefined;
}

export const getAllUsersInfoQuery = (db: Kysely<DB> = database) =>
    db
        .selectFrom("users")
        .selectAll("users")
        .select((eb) => [withMissions, withTeams]);

/** Return member informations */
export async function getAllUsersInfo(db: Kysely<DB> = database) {
    const query = db
        .selectFrom("users")
        .selectAll("users")
        .select((eb) => [withMissions, withTeams])
        .compile();

    const userInfos = await db.executeQuery(query);

    return userInfos.rows;
}

export async function getAllExpiredUsers(
    expirationDate: Date,
    db: Kysely<DB> = database
) {
    const query = protectedDataSelect(db)
        .select((eb) => [withMissions(eb), withTeams(eb)])
        .where("primary_email", "is not", null)
        .where("primary_email_status", "in", [
            EmailStatusCode.EMAIL_DELETED,
            EmailStatusCode.EMAIL_EXPIRED,
        ])
        .where("primary_email_status_updated_at", "<", expirationDate)
        .compile();

    const userInfos = await db.executeQuery(query);
    return userInfos.rows;
}

// get all data even private info
export async function adminGetAllUsersInfos(db: Kysely<DB> = database) {
    let query = db
        .selectFrom("users")
        .selectAll("users")
        .select((eb) => [withEndDate, withMissions]);

    const userInfos = await db.executeQuery(query);

    return userInfos.rows;
}

/* UTILS */

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
            .orderBy("missions.start", "asc")
            .groupBy("missions.uuid")
    )
        .$notNull()
        .as("missions");
}

function withTeams(eb: ExpressionBuilder<DB, "users">) {
    return jsonArrayFrom(
        eb
            .selectFrom(["teams"])
            .leftJoin("users_teams", "users_teams.team_id", "teams.uuid")
            .leftJoin("incubators", "incubators.uuid", "teams.incubator_id")
            .select([
                "teams.uuid",
                "teams.ghid",
                "teams.mission",
                "teams.incubator_id",
                "teams.name",
                "incubators.title as incubator_title",
            ])
            .whereRef("users_teams.user_id", "=", "users.uuid")
            .orderBy(["incubators.title asc", "teams.name asc"])
            .groupBy(["teams.uuid", "incubators.title"])
    )
        .$notNull()
        .as("teams");
}

function withStartups(eb: ExpressionBuilder<DB, "users">) {
    return jsonArrayFrom(
        eb
            .selectFrom(["startups"])
            .leftJoin(
                "missions_startups",
                "missions_startups.startup_id",
                "startups.uuid"
            )
            .leftJoin(
                "missions",
                "missions.uuid",
                "missions_startups.mission_id"
            )
            .select(["startups.uuid", "startups.name"])
            .whereRef("missions.user_id", "=", "users.uuid")
            .groupBy(["startups.uuid"])
    )
        .$notNull()
        .as("startups");
}

/** Compute member end date */
function withEndDate(
    eb: ExpressionBuilder<DB, "users">,
    db: Kysely<DB> = database
) {
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
) {
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

export async function getUserStartups(uuid: string, db: Kysely<DB> = database) {
    const result = await db
        .selectFrom("users")
        .leftJoin("missions", "missions.user_id", "users.uuid")
        .leftJoin(
            "missions_startups",
            "missions_startups.mission_id",
            "missions.uuid"
        )
        .leftJoin("startups", "startups.uuid", "missions_startups.startup_id")
        .select([
            "startups.uuid",
            "startups.ghid",
            "startups.name",
            "missions.start",
            "missions.end",
            "startups.incubator_id",
        ])
        .distinct()
        .where("users.uuid", "=", uuid)
        .where("startups.name", "is not", null)
        .orderBy("missions.start", "desc")
        .execute();

    if (!result) {
        throw new Error("Failed to insert or update mission");
    }

    return result;
}

const protectedDataSelect = (db: Kysely<DB> = database) =>
    db
        .selectFrom("users")
        .select([
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
            "users.workplace_insee_code",
            "users.competences",
        ]);
export async function getUserStartupsActive(
    uuid: string,
    db: Kysely<DB> = database
) {
    const now = new Date();
    return getUserStartups(uuid).then((startups) =>
        startups.filter(
            (startup) =>
                isAfter(now, startup.start ?? 0) &&
                isBefore(now, startup.end ?? Infinity)
        )
    );
}

export const getLatests = (db: Kysely<DB> = database) => {
    return getAllUsersInfoQuery(db)
        .select((eb) => [withStartups(eb)])
        .orderBy("users.created_at", "desc")
        .limit(10)
        .execute();
};
