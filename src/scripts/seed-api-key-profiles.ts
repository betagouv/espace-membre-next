import { addDays, subDays } from "date-fns";

import { db } from "@/lib/kysely";

/**
 * Profils de mise au point pour les perimetres de clefs d'API. ADDITIF : rien
 * n'est supprime hors des lignes prefixees `qa-`, la base importee reste
 * intacte. Relancable, et reversible par `--clean`.
 *
 *   npx tsx src/scripts/seed-api-key-profiles.ts
 *   npx tsx src/scripts/seed-api-key-profiles.ts --clean
 */

const PREFIX = "qa-";
const DOMAIN = process.env.SECRETARIAT_DOMAIN || "beta.gouv.fr";
const now = new Date();

const INCUBATORS = [
  { ghid: "qa-incub-alpha", title: "QA Incubateur ALPHA" },
  { ghid: "qa-incub-beta", title: "QA Incubateur BETA" },
];

const STARTUPS = [
  { ghid: "qa-alpha-1", name: "QA Produit ALPHA 1", incubator: "qa-incub-alpha" },
  { ghid: "qa-alpha-2", name: "QA Produit ALPHA 2", incubator: "qa-incub-alpha" },
  { ghid: "qa-beta-1", name: "QA Produit BETA 1", incubator: "qa-incub-beta" },
  { ghid: "qa-beta-2", name: "QA Produit BETA 2", incubator: "qa-incub-beta" },
];

type MissionState = "en-cours" | "finie" | "sans-fin" | "a-venir";
type Mission = { startups: string[]; state: MissionState };

const RANGES: Record<MissionState, { start: Date; end: Date | null }> = {
  "en-cours": { start: subDays(now, 30), end: addDays(now, 180) },
  finie: { start: subDays(now, 400), end: subDays(now, 100) },
  "sans-fin": { start: subDays(now, 30), end: null },
  "a-venir": { start: addDays(now, 30), end: addDays(now, 200) },
};

/**
 * Mission vivante SANS produit rattache, donnee a tous les profils. Elle les
 * rend connectables (checkUserIsExpired regarde les dates, pas les produits)
 * sans rien ajouter a leurs perimetres : les deux requetes de candidats passent
 * par missions_startups, qu'une mission nue ne renseigne pas.
 */
const MISSION_DE_CONNEXION = { startups: [], state: "en-cours" as const };

type Profile = {
  username: string;
  fullname: string;
  legal_status: string | null;
  teams: string[];
  missions: Mission[];
};

const TEAM = ["qa-team-alpha"];

/**
 * Deux axes croises. La mission porte toujours sur BETA 1, l'equipe toujours
 * sur ALPHA : mission et equipe designent deux incubateurs differents, ce qui
 * permet de lire chaque axe isolement.
 */
const MATRIX: MissionState[] = ["en-cours", "finie", "sans-fin", "a-venir"];

const matrixProfiles: Profile[] = MATRIX.flatMap((state) => [
  {
    username: `qa-${state}`,
    fullname: `QA mission ${state}, sans equipe`,
    legal_status: "contractuel",
    teams: [],
    missions: [MISSION_DE_CONNEXION, { startups: ["qa-beta-1"], state }],
  },
  {
    username: `qa-${state}-team`,
    fullname: `QA mission ${state}, equipe ALPHA`,
    legal_status: "contractuel",
    teams: TEAM,
    missions: [MISSION_DE_CONNEXION, { startups: ["qa-beta-1"], state }],
  },
]);

const PROFILES: Profile[] = [
  ...matrixProfiles,
  {
    username: "qa-aucune",
    fullname: "QA aucune mission produit, sans equipe",
    legal_status: "contractuel",
    teams: [],
    missions: [MISSION_DE_CONNEXION],
  },
  {
    username: "qa-aucune-team",
    fullname: "QA aucune mission produit, equipe ALPHA",
    legal_status: "contractuel",
    teams: TEAM,
    missions: [MISSION_DE_CONNEXION],
  },
  // Compte importe depuis beta.gouv.fr : aucun legal_status declare, donc la
  // branche isStartupAgent ne peut jamais s'allumer.
  {
    username: "qa-sans-statut",
    fullname: "QA sans statut declare, sans equipe",
    legal_status: null,
    teams: [],
    missions: [MISSION_DE_CONNEXION, { startups: ["qa-beta-1"], state: "en-cours" }],
  },
  {
    username: "qa-sans-statut-team",
    fullname: "QA sans statut declare, equipe ALPHA",
    legal_status: null,
    teams: TEAM,
    missions: [MISSION_DE_CONNEXION, { startups: ["qa-beta-1"], state: "en-cours" }],
  },
  // Deux missions dans DEUX incubateurs.
  {
    username: "qa-deux-incubs",
    fullname: "QA deux missions, deux incubateurs",
    legal_status: "contractuel",
    teams: [],
    missions: [
      { startups: ["qa-alpha-1"], state: "en-cours" },
      { startups: ["qa-beta-1"], state: "en-cours" },
    ],
  },
  // Le cas signale a l'origine : equipe ALPHA, mission vivante dans ALPHA, plus
  // une mission TERMINEE chez BETA qui ne doit plus rien apporter.
  {
    username: "qa-team",
    fullname: "QA equipe ALPHA, mission finie chez BETA",
    legal_status: "contractuel",
    teams: TEAM,
    missions: [
      { startups: ["qa-alpha-1"], state: "en-cours" },
      { startups: ["qa-beta-1"], state: "finie" },
    ],
  },
  // Deux missions dans le MEME incubateur : il ne doit apparaitre qu'une fois.
  {
    username: "qa-meme-incub",
    fullname: "QA deux missions, meme incubateur",
    legal_status: "contractuel",
    teams: [],
    missions: [
      { startups: ["qa-alpha-1"], state: "en-cours" },
      { startups: ["qa-alpha-2"], state: "en-cours" },
    ],
  },
  {
    username: "qa-admin",
    fullname: "QA admin",
    legal_status: "contractuel",
    teams: [],
    missions: [MISSION_DE_CONNEXION, { startups: ["qa-beta-1"], state: "en-cours" }],
  },
];

async function clean() {
  await db.deleteFrom("users").where("username", "like", `${PREFIX}%`).execute();
  await db.deleteFrom("teams").where("ghid", "like", `${PREFIX}%`).execute();
  await db.deleteFrom("startups").where("ghid", "like", `${PREFIX}%`).execute();
  await db
    .deleteFrom("incubators")
    .where("ghid", "like", `${PREFIX}%`)
    .execute();
  console.log("profils qa- supprimes");
}

async function seed() {
  const incubatorIds = new Map<string, string>();
  for (const incubator of INCUBATORS) {
    const row = await db
      .insertInto("incubators")
      .values({ ghid: incubator.ghid, title: incubator.title })
      .onConflict((oc) =>
        oc.column("ghid").doUpdateSet({ title: incubator.title }),
      )
      .returning("uuid")
      .executeTakeFirstOrThrow();
    incubatorIds.set(incubator.ghid, row.uuid);
  }

  const teamId = (
    await db
      .insertInto("teams")
      .values({
        ghid: "qa-team-alpha",
        name: "QA Equipe ALPHA",
        incubator_id: incubatorIds.get("qa-incub-alpha")!,
      })
      .onConflict((oc) =>
        oc.column("ghid").doUpdateSet({
          incubator_id: incubatorIds.get("qa-incub-alpha")!,
        }),
      )
      .returning("uuid")
      .executeTakeFirstOrThrow()
  ).uuid;

  const startupIds = new Map<string, string>();
  for (const startup of STARTUPS) {
    const inserted = await db
      .insertInto("startups")
      .values({ ghid: startup.ghid, name: startup.name })
      .onConflict((oc) => oc.column("ghid").doUpdateSet({ name: startup.name }))
      .returning("uuid")
      .executeTakeFirstOrThrow();
    startupIds.set(startup.ghid, inserted.uuid);

    // startups_principal_incubator_linked est differee : le principal et son
    // lien doivent atterrir dans la meme transaction.
    await db.transaction().execute(async (trx) => {
      await trx
        .updateTable("startups")
        .set({ incubator_id: incubatorIds.get(startup.incubator)! })
        .where("uuid", "=", inserted.uuid)
        .execute();
      await trx
        .insertInto("startups_incubators")
        .values({
          startup_id: inserted.uuid,
          incubator_id: incubatorIds.get(startup.incubator)!,
        })
        .onConflict((oc) =>
          oc.columns(["startup_id", "incubator_id"]).doNothing(),
        )
        .execute();
    });
  }

  for (const profile of PROFILES) {
    await db
      .deleteFrom("users")
      .where("username", "=", profile.username)
      .execute();
    const user = await db
      .insertInto("users")
      .values({
        username: profile.username,
        fullname: profile.fullname,
        primary_email: `${profile.username}@${DOMAIN}`,
        domaine: "Autre",
        role: "QA",
        legal_status: profile.legal_status,
      })
      .returning("uuid")
      .executeTakeFirstOrThrow();

    if (profile.teams.length) {
      await db
        .insertInto("users_teams")
        .values({ user_id: user.uuid, team_id: teamId })
        .execute();
    }

    for (const mission of profile.missions) {
      const inserted = await db
        .insertInto("missions")
        .values({ user_id: user.uuid, ...RANGES[mission.state] })
        .returning("uuid")
        .executeTakeFirstOrThrow();
      for (const ghid of mission.startups) {
        await db
          .insertInto("missions_startups")
          .values({ mission_id: inserted.uuid, startup_id: startupIds.get(ghid)! })
          .execute();
      }
    }
    console.log(`profil ${profile.username}@${DOMAIN}`);
  }

  console.log(
    `\nPour l'admin, ajoute qa-admin a ESPACE_MEMBRE_ADMIN dans ton .env.`,
  );
}

async function main() {
  if (process.argv.includes("--clean")) await clean();
  else await seed();
  await db.destroy();
}

main().catch(async (error) => {
  console.error(error);
  await db.destroy();
  process.exit(1);
});
