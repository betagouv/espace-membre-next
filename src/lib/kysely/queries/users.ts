import { isAfter } from "date-fns/isAfter";
import { isBefore } from "date-fns/isBefore";
import { sql, ExpressionBuilder, Kysely, SelectExpression } from "kysely";
import { UpdateObjectExpression } from "kysely/dist/cjs/parser/update-set-parser";
import _ from "lodash";

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
  db: Kysely<DB> = database,
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
  db: Kysely<DB> = database,
) {
  return protectedDataSelect(db)
    .select((eb) => [withMissions(eb), withTeams(eb)])
    .leftJoin("missions", "missions.user_id", "users.uuid")
    .leftJoin("missions_startups", "missions.uuid", "mission_id")
    .where("missions_startups.startup_id", "=", startupUuid)
    .execute();
}

export async function getUsersByStartupIds(
  startupUuids: string[],
  db: Kysely<DB> = database,
) {
  const data = await protectedDataSelect(db)
    .select((eb) => [withMissions(eb), withTeams(eb)])
    .leftJoin("missions", "missions.user_id", "users.uuid")
    .leftJoin("missions_startups", "missions.uuid", "mission_id")
    .select("startup_id")
    .where("missions_startups.startup_id", "in", startupUuids)
    .execute();
  const grouped = _.groupBy(data, "startup_id");
  return grouped;
}
/** Return member informations */
export async function getUserBasicInfo(
  params: { username: string } | { uuid: string } | { primary_email: string },
  db: Kysely<DB> = database,
) {
  let query = protectedDataSelect(db).select((eb) => [
    withMissions(eb),
    withTeams(eb),
  ]);

  if ("username" in params) {
    query = query.where("users.username", "=", params.username);
  } else if ("primary_email" in params) {
    query = query.where("users.primary_email", "=", params.primary_email);
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
  db: Kysely<DB> = database,
) {
  const query = protectedDataSelect(db)
    .select((eb) => [withMissions(eb), withTeams(eb)])
    .where("primary_email", "is not", null)
    .where("primary_email_status", "in", [
      EmailStatusCode.EMAIL_DELETED,
      EmailStatusCode.EMAIL_EXPIRED,
      EmailStatusCode.EMAIL_SUSPENDED,
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
        "missions.uuid",
      )
      .leftJoin("startups", "startups.uuid", "missions_startups.startup_id")
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
          "startups",
        ),
      ])
      .whereRef("missions.user_id", "=", "users.uuid")
      .orderBy("missions.start", "asc")
      .groupBy("missions.uuid"),
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
      .groupBy(["teams.uuid", "incubators.title"]),
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
        "startups.uuid",
      )
      .leftJoin("missions", "missions.uuid", "missions_startups.mission_id")
      .select(["startups.uuid", "startups.name"])
      .whereRef("missions.user_id", "=", "users.uuid")
      .groupBy(["startups.uuid"]),
  )
    .$notNull()
    .as("startups");
}

/** Compute member end date */
function withEndDate(
  eb: ExpressionBuilder<DB, "users">,
  db: Kysely<DB> = database,
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
        "end",
      ),
    ])
    .limit(1)
    .as("end");
}

export async function updateUser(
  uuid: string,
  userData: UpdateObjectExpression<DB, "users">,
  db: Kysely<DB> = database,
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
      "missions.uuid",
    )
    // use innerJoin instead of left join it excludes mission without startups
    .innerJoin("startups", "startups.uuid", "missions_startups.startup_id")
    .select([
      "startups.uuid",
      "startups.ghid",
      "startups.name",
      "missions.start",
      "startups.mailing_list",
      "missions.end",
      "startups.incubator_id",
    ])
    .distinct()
    .where("users.uuid", "=", uuid)
    .where("startups.name", "is not", null)
    .orderBy("missions.start", "desc")
    .execute();

  return result;
}

const protectedDataSelect = (db: Kysely<DB> = database) =>
  db
    .selectFrom("users")
    .select([
      "users.uuid",
      "users.created_at",
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
      "users.legal_status",
    ]);

export async function getUserStartupsActive(
  uuid: string,
  db: Kysely<DB> = database,
) {
  const now = new Date();
  return getUserStartups(uuid).then((startups) =>
    startups.filter(
      (startup) =>
        isAfter(now, startup.start ?? 0) &&
        isBefore(now, startup.end ?? Infinity),
    ),
  );
}

export const getUserIncubators = (uuid: string, db: Kysely<DB> = database) =>
  db
    .selectFrom("incubators")
    .select(["incubators.uuid", "incubators.title"])
    .distinct()
    .where((eb) =>
      eb.or([
        // select user teams
        eb(
          "incubators.uuid",
          "in",
          eb
            .selectFrom("teams")
            .select("teams.incubator_id")
            .innerJoin("users_teams", "users_teams.team_id", "teams.uuid")
            .where("users_teams.user_id", "=", uuid),
        ),
        // select user startup incubators
        eb(
          "incubators.uuid",
          "in",
          eb
            .selectFrom("startups")
            .select("startups.incubator_id")
            .innerJoin(
              "missions_startups",
              "missions_startups.startup_id",
              "startups.uuid",
            )
            .innerJoin(
              "missions",
              "missions.uuid",
              "missions_startups.mission_id",
            )
            .where("missions.user_id", "=", uuid),
        ),
      ]),
    )
    .execute();

export const getLatests = (db: Kysely<DB> = database) => {
  return getAllUsersInfoQuery(db)
    .select((eb) => [withStartups(eb)])
    .orderBy("users.created_at", "desc")
    .limit(10)
    .execute();
};

export const getActiveUsers = (db: Kysely<DB> = database) =>
  db
    .selectFrom("users")
    .innerJoin("missions", "missions.user_id", "users.username")
    .selectAll("users")
    .where((eb) =>
      eb.or([
        eb("missions.end", ">", new Date()),
        eb("missions.end", "is", null),
      ]),
    );
