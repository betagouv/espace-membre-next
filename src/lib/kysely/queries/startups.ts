import { ExpressionBuilder } from "kysely";

import { DB } from "@/@types/db";
import { db, jsonArrayFrom } from "@/lib/kysely";
import { getAllIncubators, getAllStartupsIncubators } from "./incubators";
import { withMemberMissions } from "./users";

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
export function getStartupMembers(startupUuid: string) {
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
    .select((eb) => [withMemberMissions(eb, { startupId: startupUuid })])
    .where((eb) =>
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
    )
    .orderBy("users.fullname", "asc")
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

// Une startup et ses phases, resolue par ghid. Undefined si inconnue.
export async function getStartupWithPhases(ghid: string) {
  return db
    .selectFrom("startups")
    .selectAll("startups")
    .select((eb) => [withStartupPhases(eb)])
    .where("startups.ghid", "=", ghid)
    .executeTakeFirst();
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
      "startups.incubator_id",
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
      // incubators suffit : le titre, les identifiants et l'incubateur
      // principal (toujours dans startups.incubator_id, remonté par le spread)
      // s'en déduisent.
      incubators: linkedIncubators,
    };
  });
  return startups;
};
