import { isAfter } from "date-fns/isAfter";
import { isBefore } from "date-fns/isBefore";
import { sql, ExpressionBuilder, Kysely, SelectExpression } from "kysely";

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

/** Return the linked Matrix/Tchap id for a user, or undefined. */
export async function getMatrixIdByUserId(
  userId: string,
  db: Kysely<DB> = database,
) {
  const row = await db
    .selectFrom("matrix_accounts")
    .select("matrix_id")
    .where("user_id", "=", userId)
    .executeTakeFirst();
  return row?.matrix_id;
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

// Missions d'un membre pour l'API protegee : chaque startup d'une mission est
// exposee par son couple { uuid, ghid }. Le ghid est l'identifiant public
// reutilisable en entree des routes ; l'uuid ne sert qu'a la correlation et n'est
// jamais accepte en entree. Le scope restreint les missions (et les startups
// agregees) a un incubateur ou a une startup precise ; sans scope, toutes les
// missions du membre sont renvoyees.
export function withMemberMissions(
  eb: ExpressionBuilder<DB, "users">,
  scope: { incubatorId?: string; startupId?: string } = {},
) {
  return jsonArrayFrom(
    eb
      .selectFrom("missions")
      .leftJoin(
        "missions_startups",
        "missions_startups.mission_id",
        "missions.uuid",
      )
      .leftJoin("startups", "startups.uuid", "missions_startups.startup_id")
      .select([
        "missions.uuid",
        "missions.start",
        "missions.end",
        "missions.status",
        "missions.employer",
        sql<
          Array<{ uuid: string; ghid: string }>
        >`coalesce(jsonb_agg(jsonb_build_object('uuid', startups.uuid, 'ghid', startups.ghid) order by startups.ghid) filter (where startups.uuid is not null), '[]'::jsonb)`.as(
          "startups",
        ),
      ])
      .whereRef("missions.user_id", "=", "users.uuid")
      // EXISTS et non une jointure : l'agregat de startups ci-dessus serait
      // duplique. Passe par la table de liaison pour couvrir la co-incubation.
      .$if(!!scope.incubatorId, (qb) =>
        qb.where((eb) =>
          eb.exists(
            eb
              .selectFrom("startups_incubators")
              .select("startups_incubators.startup_id")
              .whereRef("startups_incubators.startup_id", "=", "startups.uuid")
              .where(
                "startups_incubators.incubator_id",
                "=",
                scope.incubatorId!,
              ),
          ),
        ),
      )
      .$if(!!scope.startupId, (qb) =>
        qb.where("startups.uuid", "=", scope.startupId!),
      )
      .orderBy("missions.start", "asc")
      .groupBy("missions.uuid"),
  )
    .$notNull()
    .as("missions");
}

// Missions d'un membre exposees par l'API protegee (startups en { uuid, ghid }),
// sans scope incubateur : successeur formalise, utilise par la fiche detaillee
// /api/protected/members/{username}.
export async function getMemberApiMissions(
  userUuid: string,
  db: Kysely<DB> = database,
) {
  const row = await db
    .selectFrom("users")
    .select((eb) => [withMemberMissions(eb)])
    .where("users.uuid", "=", userUuid)
    .executeTakeFirst();
  return row?.missions ?? [];
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
      .orderBy("incubators.title", "asc")
      .orderBy("teams.name", "asc")
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
      // Correlated subquery aggregating to a uuid[]: a join would multiply the
      // rows of a co-incubated startup, and a json aggregate would break the
      // DISTINCT below (json has no equality operator in Postgres).
      sql<string[]>`(
        SELECT COALESCE(ARRAY_AGG(startups_incubators.incubator_id), '{}')
        FROM startups_incubators
        WHERE startups_incubators.startup_id = startups.uuid
      )`.as("incubator_ids"),
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
    .select(["incubators.uuid", "incubators.title", "incubators.ghid"])
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
        // startups_incubators est la source de verite : passer par
        // startups.incubator_id perdrait les incubateurs co-incubants.
        eb(
          "incubators.uuid",
          "in",
          eb
            .selectFrom("startups_incubators")
            .select("startups_incubators.incubator_id")
            .innerJoin(
              "missions_startups",
              "missions_startups.startup_id",
              "startups_incubators.startup_id",
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
    .innerJoin("missions", "missions.user_id", "users.uuid")
    .selectAll("users")
    .where((eb) =>
      eb.or([
        eb("missions.end", ">", new Date()),
        eb("missions.end", "is", null),
      ]),
    );

export const getExpiredUsers = (db: Kysely<DB> = database) =>
  db
    .selectFrom("users")
    .selectAll("users")
    .innerJoin("missions", "missions.user_id", "users.uuid")
    .where(({ eb }) =>
      eb.and([
        eb("missions.end", "is not", null),
        eb(
          "users.uuid",
          "not in",
          getActiveUsers(db).clearSelect().select("users.uuid"),
        ),
      ]),
    )
    .groupBy([
      "users.uuid",
      "users.username",
      "users.fullname",
      "users.primary_email",
    ]);
