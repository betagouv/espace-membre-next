import { Kysely } from "kysely";

import { DB } from "@/@types/db";
import { db as database, jsonArrayFrom } from "@/lib/kysely";

/**
 * EXISTS via limit(1) et non innerJoin nu : un utilisateur peut appartenir a
 * plusieurs equipes du meme incubateur, la question est booleenne.
 */
export async function isIncubatorTeamMember(
  userUuid: string,
  incubatorUuid: string,
  db: Kysely<DB> = database,
): Promise<boolean> {
  const row = await db
    .selectFrom("users_teams")
    .innerJoin("teams", "teams.uuid", "users_teams.team_id")
    .select("users_teams.user_id")
    .where("users_teams.user_id", "=", userUuid)
    .where("teams.incubator_id", "=", incubatorUuid)
    .limit(1)
    .executeTakeFirst();
  return !!row;
}

/** Incubateurs ou l'utilisateur siege dans au moins une equipe. */
export async function getUserTeamIncubatorIds(
  userUuid: string,
  db: Kysely<DB> = database,
): Promise<string[]> {
  const rows = await db
    .selectFrom("teams")
    .innerJoin("users_teams", "users_teams.team_id", "teams.uuid")
    .select("teams.incubator_id")
    .distinct()
    .where("users_teams.user_id", "=", userUuid)
    .execute();
  return rows.map((r) => r.incubator_id);
}

export async function getUserMissionEnds(
  userUuid: string,
  db: Kysely<DB> = database,
) {
  return db
    .selectFrom("missions")
    .select("missions.end")
    .where("missions.user_id", "=", userUuid)
    .execute();
}

/**
 * Membres des equipes de l'incubateur, avec les fins de mission necessaires au
 * calcul de vivacite. Aucun filtre de date en SQL : l'expiration est decidee par
 * checkUserIsExpired et nulle part ailleurs.
 */
export function getIncubatorTeamMembersWithMissions(
  incubatorUuid: string,
  db: Kysely<DB> = database,
) {
  return db
    .selectFrom("users")
    .select([
      "users.uuid",
      "users.username",
      "users.fullname",
      "users.primary_email",
      "users.secondary_email",
      "users.communication_email",
    ])
    .select((eb) => [
      jsonArrayFrom(
        eb
          .selectFrom("missions")
          .select("missions.end")
          .whereRef("missions.user_id", "=", "users.uuid"),
      )
        .$notNull()
        .as("mission_ends"),
    ])
    .where((eb) =>
      eb.exists(
        eb
          .selectFrom("users_teams")
          .innerJoin("teams", "teams.uuid", "users_teams.team_id")
          .select("users_teams.uuid")
          .whereRef("users_teams.user_id", "=", "users.uuid")
          .where("teams.incubator_id", "=", incubatorUuid),
      ),
    )
    .orderBy("users.fullname", "asc")
    .execute();
}
