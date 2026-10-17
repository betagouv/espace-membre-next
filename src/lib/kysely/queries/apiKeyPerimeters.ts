import { ExpressionBuilder, Kysely } from "kysely";

import { DB } from "@/@types/db";
import { db as database } from "@/lib/kysely";

export type PerimeterCandidate = { uuid: string; label: string };

/**
 * Ces requetes sont volontairement distinctes de getUserStartups et
 * getUserIncubators : celles-la servent l'affichage d'une fiche membre, qui doit
 * montrer le passe. Un perimetre de clef, lui, decrit un rattachement VIVANT.
 *
 * Mission en cours : commencee et pas encore finie. Une fin nulle est une
 * mission ouverte, donc vivante. Pas de fenetre de tolerance ici, contrairement
 * a checkUserIsExpired : on decrit un rattachement, pas un droit de connexion.
 */
const liveMission = (eb: ExpressionBuilder<DB, "missions">, now: Date) =>
  eb.and([
    eb("missions.start", "<=", now),
    eb.or([eb("missions.end", "is", null), eb("missions.end", ">", now)]),
  ]);

/** Produits des missions en cours. */
export async function getLiveMissionStartups(
  userUuid: string,
  db: Kysely<DB> = database,
): Promise<PerimeterCandidate[]> {
  const now = new Date();
  const rows = await db
    .selectFrom("startups")
    .select(["startups.uuid", "startups.name", "startups.ghid"])
    .distinct()
    .where((eb) =>
      eb.exists(
        eb
          .selectFrom("missions_startups")
          .innerJoin("missions", "missions.uuid", "missions_startups.mission_id")
          .select("missions.uuid")
          .whereRef("missions_startups.startup_id", "=", "startups.uuid")
          .where("missions.user_id", "=", userUuid)
          .where((inner) => liveMission(inner, now)),
      ),
    )
    .orderBy("startups.name", "asc")
    .execute();
  return rows.map((row) => ({
    uuid: row.uuid,
    label: row.name || row.ghid || row.uuid,
  }));
}

/**
 * Incubateurs vivants : ceux d'une equipe dont la personne fait partie, plus
 * ceux des produits de ses missions EN COURS. Un incubateur atteint par une
 * mission terminee disparait, il n'est plus joignable qu'en perimetre global.
 */
export async function getLivePerimeterIncubators(
  userUuid: string,
  db: Kysely<DB> = database,
): Promise<PerimeterCandidate[]> {
  const now = new Date();
  const rows = await db
    .selectFrom("incubators")
    .select(["incubators.uuid", "incubators.title", "incubators.ghid"])
    .distinct()
    .where((eb) =>
      eb.or([
        eb.exists(
          eb
            .selectFrom("teams")
            .innerJoin("users_teams", "users_teams.team_id", "teams.uuid")
            .select("teams.uuid")
            .whereRef("teams.incubator_id", "=", "incubators.uuid")
            .where("users_teams.user_id", "=", userUuid),
        ),
        // startups_incubators est la source de verite : startups.incubator_id
        // perdrait les incubateurs co-incubants.
        eb.exists(
          eb
            .selectFrom("startups_incubators")
            .innerJoin(
              "missions_startups",
              "missions_startups.startup_id",
              "startups_incubators.startup_id",
            )
            .innerJoin("missions", "missions.uuid", "missions_startups.mission_id")
            .select("startups_incubators.uuid")
            .whereRef(
              "startups_incubators.incubator_id",
              "=",
              "incubators.uuid",
            )
            .where("missions.user_id", "=", userUuid)
            .where((inner) => liveMission(inner, now)),
        ),
      ]),
    )
    .orderBy("incubators.title", "asc")
    .execute();
  return rows.map((row) => ({
    uuid: row.uuid,
    label: row.title || row.ghid || row.uuid,
  }));
}

/**
 * Produits des incubateurs dont la personne est membre d'une equipe. Ils ne
 * figurent pas dans ses missions, mais canEditStartup les lui ouvre en ecriture
 * par sa seule appartenance a l'equipe : sans eux la liste d'ecriture serait
 * saine mais incomplete.
 */
export async function getTeamIncubatorStartups(
  userUuid: string,
  db: Kysely<DB> = database,
): Promise<PerimeterCandidate[]> {
  const rows = await db
    .selectFrom("startups")
    .select(["startups.uuid", "startups.name", "startups.ghid"])
    .distinct()
    .where((eb) =>
      eb.exists(
        eb
          .selectFrom("startups_incubators")
          .innerJoin("teams", "teams.incubator_id", "startups_incubators.incubator_id")
          .innerJoin("users_teams", "users_teams.team_id", "teams.uuid")
          .select("startups_incubators.uuid")
          .whereRef("startups_incubators.startup_id", "=", "startups.uuid")
          .where("users_teams.user_id", "=", userUuid),
      ),
    )
    .orderBy("startups.name", "asc")
    .execute();
  return rows.map((row) => ({
    uuid: row.uuid,
    label: row.name || row.ghid || row.uuid,
  }));
}
