import { ExpressionBuilder, Kysely, SelectQueryBuilder } from "kysely";

import { DB } from "@/@types/db";
import { db as database } from "@/lib/kysely";
import { ApiPerimeter } from "@/models/api/perimeter";

/** Produits visibles : EXISTS sur la table de liaison, jamais innerJoin. */
export function applyStartupPerimeter<O>(
  qb: SelectQueryBuilder<DB, "startups", O>,
  perimeter: ApiPerimeter,
) {
  if (perimeter.kind === "global") return qb;
  if (perimeter.kind === "startup") {
    return qb.where("startups.uuid", "=", perimeter.uuid);
  }
  return qb.where((eb) =>
    eb.exists(
      eb
        .selectFrom("startups_incubators")
        .select("startups_incubators.startup_id")
        .whereRef("startups_incubators.startup_id", "=", "startups.uuid")
        .where("startups_incubators.incubator_id", "=", perimeter.uuid),
    ),
  );
}

/** Incubateurs visibles. Perimetre startup/S : tous les incubateurs de S. */
export function applyIncubatorPerimeter<O>(
  qb: SelectQueryBuilder<DB, "incubators", O>,
  perimeter: ApiPerimeter,
) {
  if (perimeter.kind === "global") return qb;
  if (perimeter.kind === "incubator") {
    return qb.where("incubators.uuid", "=", perimeter.uuid);
  }
  return qb.where((eb) =>
    eb.exists(
      eb
        .selectFrom("startups_incubators")
        .select("startups_incubators.incubator_id")
        .whereRef("startups_incubators.incubator_id", "=", "incubators.uuid")
        .where("startups_incubators.startup_id", "=", perimeter.uuid),
    ),
  );
}

/**
 * Membres visibles. Les deux chemins de rattachement reproduisent
 * attachedByStartup / attachedByTeam de getIncubatorMembers. Les innerJoin
 * internes sont sans danger : ils sont consommes dans un exists(), la
 * duplication n'a aucun effet.
 */
export function applyMemberPerimeter<O>(
  qb: SelectQueryBuilder<DB, "users", O>,
  perimeter: ApiPerimeter,
) {
  if (perimeter.kind === "global") return qb;

  const byStartup = (eb: ExpressionBuilder<DB, "users">, startupId: string) =>
    eb
      .selectFrom("missions")
      .innerJoin(
        "missions_startups",
        "missions_startups.mission_id",
        "missions.uuid",
      )
      .select("missions.uuid")
      .whereRef("missions.user_id", "=", "users.uuid")
      .where("missions_startups.startup_id", "=", startupId);

  if (perimeter.kind === "startup") {
    return qb.where((eb) => eb.exists(byStartup(eb, perimeter.uuid)));
  }

  return qb.where((eb) =>
    eb.or([
      eb.exists(
        eb
          .selectFrom("missions")
          .innerJoin(
            "missions_startups",
            "missions_startups.mission_id",
            "missions.uuid",
          )
          .innerJoin(
            "startups_incubators",
            "startups_incubators.startup_id",
            "missions_startups.startup_id",
          )
          .select("missions.uuid")
          .whereRef("missions.user_id", "=", "users.uuid")
          .where("startups_incubators.incubator_id", "=", perimeter.uuid),
      ),
      eb.exists(
        eb
          .selectFrom("users_teams")
          .innerJoin("teams", "teams.uuid", "users_teams.team_id")
          .select("users_teams.uuid")
          .whereRef("users_teams.user_id", "=", "users.uuid")
          .where("teams.incubator_id", "=", perimeter.uuid),
      ),
    ]),
  );
}

/* Ressource unitaire : predicats. */

export async function canAccessIncubator(
  perimeter: ApiPerimeter,
  incubatorUuid: string,
  db: Kysely<DB> = database,
): Promise<boolean> {
  if (perimeter.kind === "global") return true;
  if (perimeter.kind === "incubator") return perimeter.uuid === incubatorUuid;
  return !!(await db
    .selectFrom("startups_incubators")
    .select("startups_incubators.uuid")
    .where("startups_incubators.startup_id", "=", perimeter.uuid)
    .where("startups_incubators.incubator_id", "=", incubatorUuid)
    .executeTakeFirst());
}

/**
 * ECRITURE d'incubateur. canAccessIncubator est le predicat de LECTURE : pour un
 * perimetre startup/S il remonte vers tous les incubateurs de S, ce qui est
 * voulu en lecture (plan 5.4) mais ouvrirait en ecriture la fiche d'un
 * incubateur dont le porteur de la clef n'est membre d'aucune equipe. Un
 * perimetre produit n'autorise donc aucune ecriture d'incubateur.
 */
export function canWriteIncubator(
  perimeter: ApiPerimeter,
  incubatorUuid: string,
): boolean {
  if (perimeter.kind === "global") return true;
  if (perimeter.kind === "incubator") return perimeter.uuid === incubatorUuid;
  return false;
}

export async function canAccessStartup(
  perimeter: ApiPerimeter,
  startupUuid: string,
  db: Kysely<DB> = database,
): Promise<boolean> {
  if (perimeter.kind === "global") return true;
  if (perimeter.kind === "startup") return perimeter.uuid === startupUuid;
  return !!(await db
    .selectFrom("startups_incubators")
    .select("startups_incubators.uuid")
    .where("startups_incubators.startup_id", "=", startupUuid)
    .where("startups_incubators.incubator_id", "=", perimeter.uuid)
    .executeTakeFirst());
}

/** Une seule definition du rattachement : on reutilise applyMemberPerimeter. */
export async function canAccessMember(
  perimeter: ApiPerimeter,
  userUuid: string,
  db: Kysely<DB> = database,
): Promise<boolean> {
  if (perimeter.kind === "global") return true;
  const row = await applyMemberPerimeter(db.selectFrom("users"), perimeter)
    .select("users.uuid")
    .where("users.uuid", "=", userUuid)
    .executeTakeFirst();
  return !!row;
}
