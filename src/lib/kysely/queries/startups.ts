import { ExpressionBuilder, sql, SqlBool } from "kysely";

import { DB } from "@/@types/db";
import { db, jsonArrayFrom } from "@/lib/kysely";
import { applyStartupPerimeter } from "@/lib/api/perimeter";
import { ApiPerimeter } from "@/models/api/perimeter";
import { getAllIncubators, getAllStartupsIncubators } from "./incubators";
import { withMemberMissions } from "./users";
import { ResourceRef } from "@/lib/api/identifier";

export const getLatests = () =>
  db
    .selectFrom("startups")
    // Aggregated instead of joined: a join would make a co-incubated startup
    // eat several of the 10 slots, and the previous innerJoin on the nullable
    // incubator_id silently hid startups without any incubator.
    .select((eb) => [
      "startups.created_at",
      "startups.uuid",
      "startups.name",
      "startups.pitch",
      jsonArrayFrom(
        eb
          .selectFrom("startups_incubators")
          .innerJoin(
            "incubators",
            "incubators.uuid",
            "startups_incubators.incubator_id",
          )
          .select(["incubators.uuid", "incubators.title"])
          .whereRef("startups_incubators.startup_id", "=", "startups.uuid")
          .orderBy("incubators.title"),
      ).as("incubators"),
    ])
    .orderBy("created_at", "desc")
    .limit(10)
    .execute();

// Membres d'une startup pour l'API protegee : toute personne ayant une mission
// sur cette startup. Missions exposees avec les startups en GHID.
function startupMembersBase(startupUuid: string) {
  return db.selectFrom("users").where((eb) =>
    eb.exists(
      eb
        .selectFrom("missions")
        .innerJoin(
          "missions_startups",
          "missions_startups.mission_id",
          "missions.uuid",
        )
        .select("missions.uuid")
        .whereRef("missions.user_id", "=", "users.uuid")
        .where("missions_startups.startup_id", "=", startupUuid),
    ),
  );
}

export async function countStartupMembers(startupUuid: string) {
  // pg rend le bigint de countAll en chaine.
  const { count } = await startupMembersBase(startupUuid)
    .select((eb) => eb.fn.countAll<string>().as("count"))
    .executeTakeFirstOrThrow();
  return Number(count);
}

export function getStartupMembers(
  startupUuid: string,
  window?: { limit: number; offset: number },
) {
  return startupMembersBase(startupUuid)
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
    .select((eb) => [withMemberMissions(eb, { startupId: startupUuid })])
    // Tri stable : sans le second critere, deux homonymes peuvent s'echanger
    // entre deux pages et un enregistrement disparaitre.
    .orderBy("users.fullname", "asc")
    .orderBy("users.uuid", "asc")
    .$if(!!window, (qb) => qb.limit(window!.limit).offset(window!.offset))
    .execute();
}

// Phases d'une startup, ordonnees chronologiquement (par date de debut).
function withStartupPhases(eb: ExpressionBuilder<DB, "startups">) {
  return jsonArrayFrom(
    eb
      .selectFrom("phases")
      .select(["phases.name", "phases.start", "phases.end"])
      .whereRef("phases.startup_id", "=", "startups.uuid")
      .orderBy("phases.start", "asc")
      .orderBy("phases.end", "asc"),
  )
    .$notNull()
    .as("phases");
}

// Reproduit exactement currentPhaseName, qui prend le DERNIER element de phases
// ordonne par (start asc, end asc) : c'est le premier element de l'ordre
// inverse. En Postgres, ASC place les NULL en dernier et DESC en premier, donc
// une phase sans date de fin reste la phase courante dans les deux
// formulations.
export const currentPhaseIn = (names: string[]) => sql<SqlBool>`(
  select p.name
  from phases p
  where p.startup_id = startups.uuid
  order by p.start desc, p.end desc
  limit 1
) = any(${sql.val(names)}::text[])`;

// Incubateurs lies, en { uuid, ghid, title } : toute reponse porte uuid ET ghid.
export const withStartupIncubators = (eb: ExpressionBuilder<DB, "startups">) =>
  jsonArrayFrom(
    eb
      .selectFrom("startups_incubators")
      .innerJoin(
        "incubators",
        "incubators.uuid",
        "startups_incubators.incubator_id",
      )
      .select(["incubators.uuid", "incubators.ghid", "incubators.title"])
      .whereRef("startups_incubators.startup_id", "=", "startups.uuid")
      .orderBy("incubators.title"),
  )
    .$notNull()
    .as("incubators");

/**
 * Base immuable d'une collection de produits : perimetre et filtres, sans
 * colonnes, sans tri, sans fenetre. countApiStartups et listApiStartups la
 * consomment, ce qui garantit que total et page portent sur le meme ensemble.
 */
export function apiStartupsBase(
  perimeter: ApiPerimeter,
  filters: { phases?: string[]; incubatorUuid?: string } = {},
) {
  let query = applyStartupPerimeter(db.selectFrom("startups"), perimeter);
  if (filters.incubatorUuid) {
    query = query.where((eb) =>
      eb.exists(
        eb
          .selectFrom("startups_incubators")
          .select("startups_incubators.startup_id")
          .whereRef("startups_incubators.startup_id", "=", "startups.uuid")
          .where("startups_incubators.incubator_id", "=", filters.incubatorUuid!),
      ),
    );
  }
  if (filters.phases?.length) {
    query = query.where(currentPhaseIn(filters.phases));
  }
  return query;
}

export async function countApiStartups(
  perimeter: ApiPerimeter,
  filters: { phases?: string[]; incubatorUuid?: string } = {},
) {
  const { count } = await apiStartupsBase(perimeter, filters)
    .select((eb) => eb.fn.countAll<string>().as("count"))
    .executeTakeFirstOrThrow();
  return Number(count);
}

export function listApiStartups(
  perimeter: ApiPerimeter,
  filters: { phases?: string[]; incubatorUuid?: string },
  window: { limit: number; offset: number },
) {
  return apiStartupsBase(perimeter, filters)
    .selectAll("startups")
    .select((eb) => [withStartupPhases(eb), withStartupIncubators(eb)])
    .orderBy("startups.name", "asc")
    .orderBy("startups.uuid", "asc")
    .limit(window.limit)
    .offset(window.offset)
    .execute();
}

// Startups enrichies de leurs phases, pour l'API protegee. Filtrable par
// incubateur. Le calcul de la phase courante est laisse a l'appelant (dernier
// element chronologique) pour rester coherent avec l'ordre du tableau phases.
export function getStartupsWithPhases(incubatorUuid?: string) {
  return (
    db
      .selectFrom("startups")
      .selectAll("startups")
      .select((eb) => [withStartupPhases(eb)])
      // EXISTS et non une jointure : un produit co-incube doit remonter pour
      // chacun de ses incubateurs, sans etre duplique dans la liste.
      .$if(!!incubatorUuid, (qb) =>
        qb.where((eb) =>
          eb.exists(
            eb
              .selectFrom("startups_incubators")
              .select("startups_incubators.startup_id")
              .whereRef("startups_incubators.startup_id", "=", "startups.uuid")
              .where("startups_incubators.incubator_id", "=", incubatorUuid!),
          ),
        ),
      )
      .orderBy("startups.name", "asc")
      .execute()
  );
}

// Une startup et ses phases, resolue par ghid OU par uuid. Undefined si
// inconnue.
export async function getStartupWithPhases(ref: ResourceRef) {
  return db
    .selectFrom("startups")
    .selectAll("startups")
    .select((eb) => [withStartupPhases(eb), withStartupIncubators(eb)])
    .$if("uuid" in ref, (qb) =>
      qb.where("startups.uuid", "=", (ref as { uuid: string }).uuid),
    )
    .$if("ghid" in ref, (qb) =>
      qb.where("startups.ghid", "=", (ref as { ghid: string }).ghid),
    )
    .executeTakeFirst();
}

/** Les dix colonnes de standards, plus uuid et ghid en lecture seule. */
export function updateStartupStandards(
  startupUuid: string,
  values: Partial<{
    accessibility_status: string | null;
    dsfr_status: string | null;
    mon_service_securise: boolean | null;
    analyse_risques: boolean | null;
    analyse_risques_url: string | null;
    dashlord_url: string | null;
    tech_audit_url: string | null;
    ecodesign_url: string | null;
    stats: boolean | null;
    stats_url: string | null;
  }>,
) {
  return db
    .updateTable("startups")
    .set({ ...values, updated_at: new Date() })
    .where("startups.uuid", "=", startupUuid)
    .returning([
      "startups.uuid",
      "startups.ghid",
      "startups.accessibility_status",
      "startups.dsfr_status",
      "startups.mon_service_securise",
      "startups.analyse_risques",
      "startups.analyse_risques_url",
      "startups.dashlord_url",
      "startups.tech_audit_url",
      "startups.ecodesign_url",
      "startups.stats",
      "startups.stats_url",
    ])
    .executeTakeFirstOrThrow();
}

// techno, thematiques et usertypes sont des colonnes jsonb : un tableau JS
// passe tel quel est serialise par pg en litteral de TABLEAU, que Postgres
// refuse en 22P02 invalid input syntax for type json.
const STARTUP_JSONB_COLUMNS = ["techno", "thematiques", "usertypes"] as const;

const serializeJsonbColumns = (values: Record<string, unknown>) => {
  const out: Record<string, unknown> = { ...values };
  for (const column of STARTUP_JSONB_COLUMNS) {
    if (Array.isArray(out[column])) out[column] = JSON.stringify(out[column]);
  }
  return out;
};

/** PATCH descriptif : ni ghid, ni incubator_id, ni phases, ni standards. */
export function updateStartupDescriptive(
  startupUuid: string,
  values: Record<string, unknown>,
) {
  return db
    .updateTable("startups")
    .set({ ...serializeJsonbColumns(values), updated_at: new Date() })
    .where("startups.uuid", "=", startupUuid)
    .returningAll()
    .executeTakeFirstOrThrow();
}

const selectLastStartupPhase = (selectFrom, startupId) =>
  selectFrom("phases")
    .select("name")
    .whereRef("phases.startup_id", "=", startupId)
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
    );

export const getAllStartupsWithIncubatorAndPhase = async () => {
  const incubators = await getAllIncubators();
  // Resolved in JS rather than joined: a join on the N:N table would duplicate
  // co-incubated startups in the list.
  const incubatorIdsByStartup = new Map<string, string[]>();
  for (const link of await getAllStartupsIncubators()) {
    const ids = incubatorIdsByStartup.get(link.startup_id) ?? [];
    ids.push(link.incubator_id);
    incubatorIdsByStartup.set(link.startup_id, ids);
  }
  // todo: better typing
  const startupsData = await db
    .selectFrom("startups")
    .leftJoin(
      "users as dinum_contact",
      "dinum_contact.uuid",
      "startups.contact_dinum",
    )
    .leftJoin(
      "users as incub_contact",
      "incub_contact.uuid",
      "startups.contact_incubator",
    )
    .select([
      "startups.uuid",
      "startups.ghid",
      "startups.name",
      "startups.pitch",
      "startups.thematiques",
      "startups.techno",
      "startups.usertypes",
      "startups.contact_dinum",
      "startups.contact_incubator",
    ])
    .select((eb) => [
      eb.ref("dinum_contact.fullname").as("contact_dinum_fullname"),
      eb.ref("incub_contact.fullname").as("contact_incubator_fullname"),
    ])
    .select(({ selectFrom }) =>
      selectLastStartupPhase(selectFrom, "startups.uuid")
        .orderBy("start", "desc")
        .limit(1)
        .as("phase"),
    )
    .execute();

  type StartupsDataRow = (typeof startupsData)[number] & {
    phase: string | null;
    contact_dinum_fullname: string | null;
    contact_incubator_fullname: string | null;
  };

  const startups = startupsData.map((s) => {
    const row = s as StartupsDataRow;
    const linkedIncubators = (incubatorIdsByStartup.get(s.uuid) ?? [])
      .map((id) => incubators.find((i) => i.uuid === id))
      .filter((i) => i !== undefined)
      .map((i) => ({ uuid: i.uuid, title: i.title }));
    return {
      ...s,
      phase: row.phase,
      thematiques: (s.thematiques as string[]) || [],
      techno: (s.techno as string[]) || [],
      usertypes: (s.usertypes as string[]) || [],
      contact_dinum: s.contact_dinum,
      contact_incubator: s.contact_incubator,
      contact_dinum_fullname: row.contact_dinum_fullname,
      contact_incubator_fullname: row.contact_incubator_fullname,
      // La liste suffit à l'affichage comme au filtre : ni les identifiants ni
      // les titres n'ont besoin d'être exposés à côté.
      incubators: linkedIncubators,
    };
  });
  return startups;
};
