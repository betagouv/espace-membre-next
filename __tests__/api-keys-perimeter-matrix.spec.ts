import { expect } from "chai";
import { addDays, subDays } from "date-fns";

import { apiKeyPerimeterOptions } from "@/lib/api-keys/perimeterOptions";
import { AuthSubject } from "@/lib/authorization/subject";
import { db } from "@/lib/kysely";

import { createData, deleteData, FakeDataInterface } from "./utils/fakeData";

const now = new Date();

/**
 * Table de verite des perimetres. Deux axes croises :
 *   - l'etat de la mission, portee sur BETA 1 : en cours, finie, sans fin,
 *     a venir, aucune
 *   - le siege dans une equipe de ALPHA : oui ou non
 * plus un troisieme axe traite a part, legal_status, qui ne pese que sur la
 * branche isStartupAgent.
 *
 * Mission et equipe portent volontairement sur DEUX incubateurs differents :
 * c'est ce qui permet de lire chaque axe isolement.
 */
const ENCOURS = { start: subDays(now, 30), end: addDays(now, 180) };
const FINIE = { start: subDays(now, 400), end: subDays(now, 100) };
const AVENIR = { start: addDays(now, 30), end: addDays(now, 200) };
// `end: null` n'est pas exprimable via fakeData, la colonne est mise a NULL
// juste apres la creation.
const SANSFIN = { start: subDays(now, 30), end: addDays(now, 180) };

const TEAM = ["mx-team-alpha"];

const testData: FakeDataInterface = {
  incubators: [
    { ghid: "mx-alpha", title: "ALPHA" },
    { ghid: "mx-beta", title: "BETA" },
  ],
  startups: [
    { ghid: "mx-alpha-1", name: "ALPHA 1", incubator: "mx-alpha" },
    { ghid: "mx-alpha-2", name: "ALPHA 2", incubator: "mx-alpha" },
    { ghid: "mx-beta-1", name: "BETA 1", incubator: "mx-beta" },
    { ghid: "mx-beta-2", name: "BETA 2", incubator: "mx-beta" },
  ],
  teams: [{ ghid: "mx-team-alpha", name: "Equipe ALPHA", incubator: "mx-alpha" }],
  users: [
    { username: "mx-encours", missions: [{ ...ENCOURS, startups: ["mx-beta-1"] }] },
    {
      username: "mx-encours-team",
      teams: TEAM,
      missions: [{ ...ENCOURS, startups: ["mx-beta-1"] }],
    },
    { username: "mx-finie", missions: [{ ...FINIE, startups: ["mx-beta-1"] }] },
    {
      username: "mx-finie-team",
      teams: TEAM,
      missions: [{ ...FINIE, startups: ["mx-beta-1"] }],
    },
    { username: "mx-sansfin", missions: [{ ...SANSFIN, startups: ["mx-beta-1"] }] },
    {
      username: "mx-sansfin-team",
      teams: TEAM,
      missions: [{ ...SANSFIN, startups: ["mx-beta-1"] }],
    },
    { username: "mx-avenir", missions: [{ ...AVENIR, startups: ["mx-beta-1"] }] },
    {
      username: "mx-avenir-team",
      teams: TEAM,
      missions: [{ ...AVENIR, startups: ["mx-beta-1"] }],
    },
    { username: "mx-aucune", missions: [] },
    { username: "mx-aucune-team", teams: TEAM, missions: [] },
    {
      username: "mx-nostatut",
      missions: [{ ...ENCOURS, startups: ["mx-beta-1"] }],
    },
    {
      username: "mx-nostatut-team",
      teams: TEAM,
      missions: [{ ...ENCOURS, startups: ["mx-beta-1"] }],
    },
  ],
};

const SANS_STATUT = ["mx-nostatut", "mx-nostatut-team"];
const SANS_FIN = ["mx-sansfin", "mx-sansfin-team"];

type Cell = {
  readIncubators: string[];
  readStartups: string[];
  writeIncubators: string[];
  writeStartups: string[];
};

const ALPHA_PRODUITS = ["ALPHA 1", "ALPHA 2"];
const RIEN: Cell = {
  readIncubators: [],
  readStartups: [],
  writeIncubators: [],
  writeStartups: [],
};
// Ce que l'equipe ALPHA apporte a elle seule, quel que soit l'etat des missions.
const EQUIPE_SEULE: Cell = {
  readIncubators: ["ALPHA"],
  readStartups: [],
  writeIncubators: ["ALPHA"],
  writeStartups: ALPHA_PRODUITS,
};

const EXPECTED: Record<string, Cell> = {
  // Mission EN COURS, agent public : le produit est lisible et ecrivable, mais
  // l'incubateur ne l'est pas, l'ecriture d'incubateur passe par l'equipe.
  "mx-encours": {
    readIncubators: ["BETA"],
    readStartups: ["BETA 1"],
    writeIncubators: [],
    writeStartups: ["BETA 1"],
  },
  "mx-encours-team": {
    readIncubators: ["ALPHA", "BETA"],
    readStartups: ["BETA 1"],
    writeIncubators: ["ALPHA"],
    writeStartups: [...ALPHA_PRODUITS, "BETA 1"],
  },

  // Mission FINIE : elle n'apporte plus rien, ni en lecture ni en ecriture.
  "mx-finie": RIEN,
  "mx-finie-team": EQUIPE_SEULE,

  // Mission SANS FIN : vivante des deux cotes depuis la correction de
  // isStartupAgent. Le formulaire ne laisse une mission sans terme qu'au statut
  // « Agent Public », donc a la population meme que ce predicat reconnait :
  // l'exclure inversait la regle, une mission finissant demain donnait plus de
  // droits qu'une mission ouverte.
  "mx-sansfin": {
    readIncubators: ["BETA"],
    readStartups: ["BETA 1"],
    writeIncubators: [],
    writeStartups: ["BETA 1"],
  },
  "mx-sansfin-team": {
    readIncubators: ["ALPHA", "BETA"],
    readStartups: ["BETA 1"],
    writeIncubators: ["ALPHA"],
    writeStartups: [...ALPHA_PRODUITS, "BETA 1"],
  },

  // Mission A VENIR : `start <= now` n'est pas satisfait, elle ne compte pas.
  "mx-avenir": RIEN,
  "mx-avenir-team": EQUIPE_SEULE,

  // AUCUNE mission.
  "mx-aucune": RIEN,
  "mx-aucune-team": EQUIPE_SEULE,

  // Mission en cours mais SANS legal_status : lisible, jamais ecrivable par la
  // branche agent. C'est l'etat d'un compte importe depuis beta.gouv.fr.
  "mx-nostatut": {
    readIncubators: ["BETA"],
    readStartups: ["BETA 1"],
    writeIncubators: [],
    writeStartups: [],
  },
  "mx-nostatut-team": {
    readIncubators: ["ALPHA", "BETA"],
    readStartups: ["BETA 1"],
    writeIncubators: ["ALPHA"],
    writeStartups: ALPHA_PRODUITS,
  },
};

describe("api key perimeter matrix", () => {
  const subjects = new Map<string, AuthSubject>();

  before(async () => {
    await createData(testData);

    await db
      .updateTable("users")
      .set({ legal_status: "contractuel" })
      .where("username", "like", "mx-%")
      .where("username", "not in", SANS_STATUT)
      .execute();

    // La mission sans fin, que fakeData ne sait pas exprimer.
    await db
      .updateTable("missions")
      .set({ end: null })
      .where((eb) =>
        eb.exists(
          eb
            .selectFrom("users")
            .select("users.uuid")
            .whereRef("users.uuid", "=", "missions.user_id")
            .where("users.username", "in", SANS_FIN),
        ),
      )
      .execute();

    for (const user of testData.users!) {
      const row = await db
        .selectFrom("users")
        .select("uuid")
        .where("username", "=", user.username)
        .executeTakeFirstOrThrow();
      subjects.set(user.username, {
        uuid: row.uuid,
        username: user.username,
        isAdmin: false,
      });
    }
  });

  after(async () => {
    await deleteData(testData);
  });

  const labels = (options: { label: string }[]) =>
    options.map((option) => option.label).sort();

  for (const [username, expected] of Object.entries(EXPECTED)) {
    it(`${username}`, async () => {
      const subject = subjects.get(username)!;
      const options = await apiKeyPerimeterOptions(subject, subject.uuid);
      expect(labels(options.read.incubators), "lecture incubateurs").to.deep.equal(
        expected.readIncubators,
      );
      expect(labels(options.read.startups), "lecture produits").to.deep.equal(
        expected.readStartups,
      );
      expect(
        labels(options.write.incubators),
        "ecriture incubateurs",
      ).to.deep.equal(expected.writeIncubators);
      expect(labels(options.write.startups), "ecriture produits").to.deep.equal(
        expected.writeStartups,
      );
    });
  }

  // BETA 2 n'est rattache a personne : il ne doit apparaitre nulle part.
  it("never offers a product nobody is attached to", async () => {
    for (const username of Object.keys(EXPECTED)) {
      const subject = subjects.get(username)!;
      const options = await apiKeyPerimeterOptions(subject, subject.uuid);
      for (const list of [options.read.startups, options.write.startups]) {
        expect(labels(list), username).to.not.include("BETA 2");
      }
    }
  });
});
