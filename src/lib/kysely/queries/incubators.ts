import { ExpressionBuilder } from "kysely";

import { withMemberMissions } from "./users";
import { DB } from "@/@types/db";
import { db, jsonArrayFrom } from "@/lib/kysely";

/** Return all incubators */
export function getAllIncubators() {
  return selectIncubator().execute();
}

/** Return all incubators */
export async function getAllIncubatorsOptions() {
  const incubs = await getAllIncubators();
  return incubs.map((incub) => ({
    value: incub.uuid,
    label: `${incub.title} ${incub.ghid ? `(${incub.ghid})` : ""}`,
  }));
}

/** Return incubator startups (including startups it co-incubates) */
export function getIncubatorStartups(uuid: string) {
  return db
    .selectFrom("startups")
    .innerJoin(
      "startups_incubators",
      "startups_incubators.startup_id",
      "startups.uuid",
    )
    .select(({ selectFrom }) => [
      "startups.uuid",
      "startups.name",
      "startups.pitch",
      "startups.ghid",
      selectFrom("phases")
        .select("name")
        .whereRef("phases.startup_id", "=", "startups.uuid")
        .where((eb) =>
          eb(
            "phases.start",
            "=",
            eb
              .selectFrom("phases")
              .select(eb.fn.max("phases.start").as("max_start"))
              .whereRef("phases.startup_id", "=", "startups.uuid")

              .limit(1),
          ),
        )
        .orderBy("start", "desc")
        .limit(1)
        .as("phase"),
    ])
    .where("startups_incubators.incubator_id", "=", uuid)
    .orderBy("startups.name")
    .execute();
}

/** Return all incubators (full model) linked to a startup via the N:N join table */
export function getStartupIncubators(startupId: string) {
  return selectIncubator()
    .innerJoin(
      "startups_incubators",
      "startups_incubators.incubator_id",
      "incubators.uuid",
    )
    .where("startups_incubators.startup_id", "=", startupId)
    .orderBy("incubators.title")
    .execute();
}

/**
 * Return every (startup_id, incubator_id) pair from the N:N join table.
 * Ordered by incubator title so every caller builds a stable list: the rendered
 * order and the API payload must not shift from one request to the next.
 */
export function getAllStartupsIncubators() {
  return db
    .selectFrom("startups_incubators")
    .innerJoin(
      "incubators",
      "incubators.uuid",
      "startups_incubators.incubator_id",
    )
    .select([
      "startups_incubators.startup_id",
      "startups_incubators.incubator_id",
    ])
    .orderBy("incubators.title")
    .execute();
}

/** Return the incubator uuids linked to a startup via the N:N join table */
export async function getStartupIncubatorIds(startupId: string) {
  const rows = await db
    .selectFrom("startups_incubators")
    .innerJoin(
      "incubators",
      "incubators.uuid",
      "startups_incubators.incubator_id",
    )
    .select("startups_incubators.incubator_id")
    .where("startups_incubators.startup_id", "=", startupId)
    .orderBy("incubators.title")
    .execute();
  return rows.map((row) => row.incubator_id);
}

function selectIncubator() {
  return db
    .selectFrom("incubators")
    .leftJoin("organizations", "organizations.uuid", "incubators.owner_id")
    .select([
      "incubators.title",
      "incubators.uuid",
      "incubators.description",
      "incubators.contact",
      "incubators.short_description",
      "incubators.ghid",
      "incubators.github",
      "incubators.owner_id",
      "incubators.address",
      "incubators.highlighted_startups",
      "incubators.website",
      "organizations.name as organization_name",
    ]);
}

/** Return all incubators */
export async function getIncubator(uuid: string) {
  return await selectIncubator()
    .where("incubators.uuid", "=", uuid)
    .executeTakeFirstOrThrow();
}

/** Return an incubator by its ghid (acronyme), or undefined if unknown */
export async function getIncubatorByGhid(ghid: string) {
  return await selectIncubator()
    .where("incubators.ghid", "=", ghid)
    .executeTakeFirst();
}

export async function getAllIncubatorsActiveMembers() {
  return db
    .selectFrom("incubators")
    .select(({ selectFrom, eb }) => [
      "incubators.uuid",
      "incubators.title",
      jsonArrayFrom(
        // startups members affiliated to incubator
        eb
          .selectFrom("users")
          .select(["users.uuid", "users.fullname"])
          .leftJoin("missions", "missions.user_id", "users.uuid")
          .leftJoin(
            "missions_startups",
            "missions_startups.mission_id",
            "missions.uuid",
          )
          .leftJoin("startups", "startups.uuid", "missions_startups.startup_id")
          .leftJoin(
            "startups_incubators",
            "startups_incubators.startup_id",
            "startups.uuid",
          )
          // only include active users
          .where((eb) =>
            eb.or([
              eb("missions.end", "is", null),
              eb("missions.end", ">=", new Date()),
            ]),
          )
          .whereRef("startups_incubators.incubator_id", "=", "incubators.uuid")
          .union(() =>
            // team members affiliated to incubator
            eb
              .selectFrom("users")
              .select(["users.uuid", "users.fullname"])
              .leftJoin("users_teams", "users_teams.user_id", "users.uuid")
              .leftJoin("teams", "teams.uuid", "users_teams.team_id")
              .whereRef("teams.incubator_id", "=", "incubators.uuid"),
          ),
      ).as("members"),
    ])
    .execute();
}

// Membres rattaches a un incubateur, par ses startups ET/OU ses equipes.
// Contrairement a getAllIncubatorsActiveMembers, AUCUN filtre de date n'est
// applique :
// les deux chemins de rattachement se comportent de facon identique et la route
// renvoie par defaut tous les rattaches, y compris les missions terminees.
// Chaque membre porte deux booleens (viaStartups / viaTeams) permettant de
// deduire le discriminant "attachment", ses missions (startups en GHID) et les
// GHID des equipes de cet incubateur auxquelles il appartient.
export function getIncubatorMembers(incubatorUuid: string) {
  const attachedByStartup = (eb: ExpressionBuilder<DB, "users">) =>
    eb
      .selectFrom("missions")
      .innerJoin(
        "missions_startups",
        "missions_startups.mission_id",
        "missions.uuid",
      )
      // Par la table de liaison : une personne en mission sur un produit
      // co-incube est rattachee a CHACUN de ses incubateurs. Le tout est
      // consomme dans un exists(), la duplication est donc sans effet.
      .innerJoin(
        "startups_incubators",
        "startups_incubators.startup_id",
        "missions_startups.startup_id",
      )
      .select("missions.uuid")
      .whereRef("missions.user_id", "=", "users.uuid")
      .where("startups_incubators.incubator_id", "=", incubatorUuid);

  const attachedByTeam = (eb: ExpressionBuilder<DB, "users">) =>
    eb
      .selectFrom("users_teams")
      .innerJoin("teams", "teams.uuid", "users_teams.team_id")
      .select("users_teams.uuid")
      .whereRef("users_teams.user_id", "=", "users.uuid")
      .where("teams.incubator_id", "=", incubatorUuid);

  return db
    .selectFrom("users")
    .select([
      "users.uuid",
      "users.username",
      "users.fullname",
      "users.github",
      "users.primary_email",
      "users.secondary_email",
      "users.communication_email",
      "users.primary_email_status",
    ])
    .select((eb) => [
      withMemberMissions(eb, { incubatorId: incubatorUuid }),
      jsonArrayFrom(
        eb
          .selectFrom("teams")
          .innerJoin("users_teams", "users_teams.team_id", "teams.uuid")
          .select("teams.ghid")
          .whereRef("users_teams.user_id", "=", "users.uuid")
          .where("teams.incubator_id", "=", incubatorUuid),
      )
        .$notNull()
        .as("incubatorTeams"),
      eb.exists(attachedByStartup(eb)).as("viaStartups"),
      eb.exists(attachedByTeam(eb)).as("viaTeams"),
    ])
    .where((eb) =>
      eb.or([eb.exists(attachedByStartup(eb)), eb.exists(attachedByTeam(eb))]),
    )
    .orderBy("users.fullname", "asc")
    .execute();
}

export function getIncubatorTeams(uuid: string) {
  return db
    .selectFrom("incubators")
    .leftJoin("teams", "teams.incubator_id", "incubators.uuid")
    .select(["teams.name", "teams.mission", "teams.uuid"])
    .where("incubators.uuid", "=", uuid)
    .orderBy("teams.name")
    .execute();
}

export function getUserTeamsIncubators(uuid: string) {
  return db
    .selectFrom("users")
    .leftJoin("users_teams", "users_teams.user_id", "users.uuid")
    .leftJoin("teams", "users_teams.team_id", "teams.uuid")
    .leftJoin("incubators", "teams.incubator_id", "incubators.uuid")
    .selectAll(["incubators"])
    .where("users.uuid", "=", uuid)
    .execute();
}
