import { ExpressionBuilder, sql, SqlBool } from "kysely";

import { withMemberMissions } from "./users";
import { DB } from "@/@types/db";
import { ResourceRef } from "@/lib/api/identifier";
import {
  applyIncubatorPerimeter,
  applyMemberPerimeter,
} from "@/lib/api/perimeter";
import { db, jsonArrayFrom } from "@/lib/kysely";
import { ApiPerimeter } from "@/models/api/perimeter";

/** Return all incubators */
export function getAllIncubators() {
  return selectIncubator().execute();
}

/** Return all incubators */
export async function getAllIncubatorsOptions() {
  const incubs = await getAllIncubators();
  return incubs.map((incub) => ({
    value: incub.uuid,
    label: `${incub.title} (${incub.ghid})`,
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

const INCUBATOR_COLUMNS = [
  "incubators.title",
  "incubators.uuid",
  "incubators.description",
  "incubators.contact",
  "incubators.short_description",
  "incubators.ghid",
  "incubators.github",
  "incubators.owner_id",
  "incubators.address",
  "incubators.website",
  "organizations.name as organization_name",
] as const;

/**
 * highlighted_startups est stocke en uuid et expose en ghid, comme partout
 * ailleurs dans l'API. Colonne nulle rendue en tableau vide, reference
 * orpheline filtree : le tableau ne porte que des ghid resolvables.
 */
export const withHighlightedStartupGhids = () =>
  // incubators.highlighted_startups est de type uuid[] : comparer
  // startups.uuid::text ferait echouer la requete des la planification
  // (operator does not exist: text = uuid), donc sur une table meme vide.
  // json_agg porte une valeur SCALAIRE et non une ligne : le schema de sortie
  // attend string[], la forme [{ghid}] d'un jsonArrayFrom le ferait rejeter
  // en 422 des qu'un incubateur renseigne la colonne.
  sql<string[]>`(
    select coalesce(json_agg(s.ghid order by s.ghid), '[]'::json)
    from startups s
    where s.uuid = any(incubators.highlighted_startups)
  )`.as("highlighted_startups");

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

/** Resolution ghid-ou-uuid pour l'API. Undefined si inconnu. */
export async function getIncubatorByRef(ref: ResourceRef) {
  return selectIncubator()
    .$if("uuid" in ref, (qb) =>
      qb.where("incubators.uuid", "=", (ref as { uuid: string }).uuid),
    )
    .$if("ghid" in ref, (qb) =>
      qb.where("incubators.ghid", "=", (ref as { ghid: string }).ghid),
    )
    .executeTakeFirst();
}

/**
 * Base immuable d'une collection d'incubateurs : perimetre seul, sans colonnes,
 * sans tri, sans fenetre.
 */
export function apiIncubatorsBase(perimeter: ApiPerimeter) {
  return applyIncubatorPerimeter(db.selectFrom("incubators"), perimeter);
}

export async function countApiIncubators(perimeter: ApiPerimeter) {
  const { count } = await apiIncubatorsBase(perimeter)
    .select((eb) => eb.fn.countAll<string>().as("count"))
    .executeTakeFirstOrThrow();
  return Number(count);
}

export function listApiIncubators(
  perimeter: ApiPerimeter,
  window: { limit: number; offset: number },
) {
  return apiIncubatorsBase(perimeter)
    .leftJoin("organizations", "organizations.uuid", "incubators.owner_id")
    .select(INCUBATOR_COLUMNS)
    .select(() => [withHighlightedStartupGhids()])
    .orderBy("incubators.title", "asc")
    .orderBy("incubators.uuid", "asc")
    .limit(window.limit)
    .offset(window.offset)
    .execute();
}

/** PATCH descriptif : le ghid n'est pas exposable en ecriture par l'API. */
export function updateIncubatorDescriptive(
  incubatorUuid: string,
  values: Record<string, unknown>,
) {
  return db
    .updateTable("incubators")
    .set(values)
    .where("incubators.uuid", "=", incubatorUuid)
    .returningAll()
    .executeTakeFirstOrThrow();
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
// attachedByStartup et attachedByTeam sont parametres par l'incubateur au lieu
// d'etre des fermetures internes : incubatorMembersBase, countIncubatorMembers
// et getIncubatorMembers les partagent.
const attachedByStartup = (
  eb: ExpressionBuilder<DB, "users">,
  incubatorUuid: string,
) =>
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

const attachedByTeam = (
  eb: ExpressionBuilder<DB, "users">,
  incubatorUuid: string,
) =>
  eb
    .selectFrom("users_teams")
    .innerJoin("teams", "teams.uuid", "users_teams.team_id")
    .select("users_teams.uuid")
    .whereRef("users_teams.user_id", "=", "users.uuid")
    .where("teams.incubator_id", "=", incubatorUuid);

function incubatorMembersBase(
  incubatorUuid: string,
  filters: { activeOnly?: boolean; perimeter?: ApiPerimeter } = {},
) {
  // Sans filtre : exists(byStartup) OR exists(byTeam). Avec ?status=active :
  // exists(byActiveStartup) OR exists(byTeam), un rattachement par equipe ne
  // portant pas de date et restant donc toujours actif.
  const now = new Date();
  const base = db.selectFrom("users").where((eb) =>
    eb.or([
      eb.exists(
        filters.activeOnly
          ? attachedByStartup(eb, incubatorUuid).where((qb) =>
              qb.or([
                qb("missions.end", "is", null),
                // Comparaison stricte, a l'identique du predicat en memoire
                // remplace, et non le >= de getAllIncubatorsActiveMembers.
                qb("missions.end", ">", now),
              ]),
            )
          : attachedByStartup(eb, incubatorUuid),
      ),
      eb.exists(attachedByTeam(eb, incubatorUuid)),
    ]),
  );
  // Le perimetre de la clef s'AJOUTE au filtre du chemin : une clef startup/S
  // ne doit pas enumerer les membres des autres produits d'un incubateur de S,
  // alors meme que le chemin la laisse atteindre cet incubateur.
  return filters.perimeter
    ? applyMemberPerimeter(base, filters.perimeter)
    : base;
}

export async function countIncubatorMembers(
  incubatorUuid: string,
  filters: { activeOnly?: boolean; perimeter?: ApiPerimeter } = {},
) {
  const { count } = await incubatorMembersBase(incubatorUuid, filters)
    .select((eb) => eb.fn.countAll<string>().as("count"))
    .executeTakeFirstOrThrow();
  return Number(count);
}

export function getIncubatorMembers(
  incubatorUuid: string,
  filters: { activeOnly?: boolean; perimeter?: ApiPerimeter } = {},
  window?: { limit: number; offset: number },
) {
  return incubatorMembersBase(incubatorUuid, filters)
    .select([
      "users.uuid",
      "users.username",
      "users.fullname",
      "users.github",
      "users.primary_email",
      "users.secondary_email",
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
      // attachment decrit le chemin de rattachement, pas son activite : ces
      // deux booleens restent calcules sans le filtre.
      eb.exists(attachedByStartup(eb, incubatorUuid)).as("viaStartups"),
      eb.exists(attachedByTeam(eb, incubatorUuid)).as("viaTeams"),
    ])
    .orderBy("users.fullname", "asc")
    .orderBy("users.uuid", "asc")
    .$if(!!window, (qb) => qb.limit(window!.limit).offset(window!.offset))
    .execute();
}

// Part de teams et non d'incubators : un leftJoin depuis incubators rendait une
// ligne entierement NULL pour un incubateur sans equipe, et la page en tirait un
// <Link href="/teams/null">.
export function getIncubatorTeams(uuid: string) {
  return db
    .selectFrom("teams")
    .select(["teams.name", "teams.mission", "teams.uuid"])
    .where("teams.incubator_id", "=", uuid)
    .orderBy("teams.name")
    .execute();
}


