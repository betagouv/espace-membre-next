import { expect } from "chai";
import { addDays, subDays } from "date-fns";

import { apiKeyPerimeterOptions } from "@/lib/api-keys/perimeterOptions";
import { AuthSubject } from "@/lib/authorization/subject";
import { db } from "@/lib/kysely";
import { apiKeyCreateSchema } from "@/models/api/apiKey";

import { createData, deleteData, FakeDataInterface } from "./utils/fakeData";

const now = new Date();
const live = { start: subDays(now, 30), end: addDays(now, 180) };
const over = { start: subDays(now, 400), end: subDays(now, 100) };

/**
 * Les six profils du script src/scripts/seed-api-key-profiles.ts, reproduits a
 * l'identique : ce fichier est le tableau des perimetres attendus, verifiable
 * en direct sur la base de dev.
 */
const testData: FakeDataInterface = {
  incubators: [
    { ghid: "pf-alpha", title: "ALPHA" },
    { ghid: "pf-beta", title: "BETA" },
  ],
  startups: [
    { ghid: "pf-alpha-1", name: "ALPHA 1", incubator: "pf-alpha" },
    { ghid: "pf-alpha-2", name: "ALPHA 2", incubator: "pf-alpha" },
    { ghid: "pf-beta-1", name: "BETA 1", incubator: "pf-beta" },
    { ghid: "pf-beta-2", name: "BETA 2", incubator: "pf-beta" },
  ],
  teams: [{ ghid: "pf-team-alpha", name: "Equipe ALPHA", incubator: "pf-alpha" }],
  users: [
    {
      username: "pf-solo",
      missions: [{ ...live, startups: ["pf-alpha-1"] }],
    },
    {
      username: "pf-deux-incubs",
      missions: [
        { ...live, startups: ["pf-alpha-1"] },
        { ...live, startups: ["pf-beta-1"] },
      ],
    },
    {
      username: "pf-meme-incub",
      missions: [
        { ...live, startups: ["pf-alpha-1"] },
        { ...live, startups: ["pf-alpha-2"] },
      ],
    },
    {
      username: "pf-team",
      teams: ["pf-team-alpha"],
      missions: [
        { ...live, startups: ["pf-alpha-1"] },
        { ...over, startups: ["pf-beta-1"] },
      ],
    },
    {
      username: "pf-admin",
      missions: [{ ...live, startups: ["pf-alpha-1"] }],
    },
    {
      username: "pf-sans-statut",
      missions: [{ ...live, startups: ["pf-alpha-1"] }],
    },
  ],
};

// Tous agents publics, sauf pf-sans-statut : isStartupAgent l'exige, et c'est
// l'etat par defaut d'un compte importe depuis beta.gouv.fr.
const AGENTS = [
  "pf-solo",
  "pf-deux-incubs",
  "pf-meme-incub",
  "pf-team",
  "pf-admin",
];

type Expected = {
  readIncubators: string[];
  readStartups: string[];
  writeIncubators: string[];
  writeStartups: string[];
};

const EXPECTED: Record<string, Expected> = {
  "pf-solo": {
    readIncubators: ["ALPHA"],
    readStartups: ["ALPHA 1"],
    writeIncubators: [],
    writeStartups: ["ALPHA 1"],
  },
  "pf-deux-incubs": {
    readIncubators: ["ALPHA", "BETA"],
    readStartups: ["ALPHA 1", "BETA 1"],
    writeIncubators: [],
    writeStartups: ["ALPHA 1", "BETA 1"],
  },
  // Deux missions dans le meme incubateur : il ne doit apparaitre qu'une fois.
  "pf-meme-incub": {
    readIncubators: ["ALPHA"],
    readStartups: ["ALPHA 1", "ALPHA 2"],
    writeIncubators: [],
    writeStartups: ["ALPHA 1", "ALPHA 2"],
  },
  // LE cas signale : equipe d'ALPHA, mission TERMINEE chez BETA. BETA disparait
  // des deux listes. ALPHA 2 apparait en ecriture sans aucune mission dessus,
  // par l'appartenance a l'equipe.
  "pf-team": {
    readIncubators: ["ALPHA"],
    readStartups: ["ALPHA 1"],
    writeIncubators: ["ALPHA"],
    writeStartups: ["ALPHA 1", "ALPHA 2"],
  },
  "pf-admin": {
    readIncubators: ["ALPHA"],
    readStartups: ["ALPHA 1"],
    writeIncubators: ["ALPHA"],
    writeStartups: ["ALPHA 1"],
  },
  // Sans legal_status, la branche isStartupAgent ne s'allume jamais : aucune
  // ecriture, donc les cases d'ecriture disparaissent du formulaire.
  "pf-sans-statut": {
    readIncubators: ["ALPHA"],
    readStartups: ["ALPHA 1"],
    writeIncubators: [],
    writeStartups: [],
  },
};

describe("api key perimeter options", () => {
  const subjects = new Map<string, AuthSubject>();

  before(async () => {
    await createData(testData);
    await db
      .updateTable("users")
      .set({ legal_status: "contractuel" })
      .where("username", "in", AGENTS)
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
        isAdmin: user.username === "pf-admin",
      });
    }
  });

  after(async () => {
    await deleteData(testData);
  });

  const labels = (options: { label: string }[]) =>
    options.map((option) => option.label).sort();

  for (const [username, expected] of Object.entries(EXPECTED)) {
    it(`gives ${username} exactly its perimeters`, async () => {
      const subject = subjects.get(username)!;
      const options = await apiKeyPerimeterOptions(subject, subject.uuid);

      expect(labels(options.read.incubators), "lecture, incubateurs").to.deep.equal(
        expected.readIncubators,
      );
      expect(labels(options.read.startups), "lecture, produits").to.deep.equal(
        expected.readStartups,
      );
      expect(
        labels(options.write.incubators),
        "ecriture, incubateurs",
      ).to.deep.equal(expected.writeIncubators);
      expect(labels(options.write.startups), "ecriture, produits").to.deep.equal(
        expected.writeStartups,
      );
    });
  }

  /**
   * Ce que personne ne doit voir : BETA 2 n'est rattache a aucun des six, ni
   * par mission ni par equipe. S'il apparait quelque part, une des listes est
   * devenue globale.
   */
  it("never offers a product nobody is attached to", async () => {
    for (const username of Object.keys(EXPECTED)) {
      const subject = subjects.get(username)!;
      const options = await apiKeyPerimeterOptions(subject, subject.uuid);
      for (const list of [options.read.startups, options.write.startups]) {
        expect(labels(list), username).to.not.include("BETA 2");
      }
    }
  });

  /**
   * canWriteIncubator refuse par construction un perimetre de nature produit
   * (plan 5.4) : une clef portant incubators:write avec un perimetre startup
   * ne peut RIEN ecrire. Le schema doit la refuser a la creation plutot que de
   * livrer une portee morte que rien ne signale.
   */
  it("refuses incubators:write carried by a startup write perimeter", async () => {
    const startup = await db
      .selectFrom("startups")
      .select("uuid")
      .where("ghid", "=", "pf-alpha-1")
      .executeTakeFirstOrThrow();

    const parsed = apiKeyCreateSchema.safeParse({
      name: "clef a portee morte",
      kind: "personal",
      scopes: ["incubators:write"],
      read_perimeter: { kind: "global" },
      write_perimeter: { kind: "startup", uuid: startup.uuid },
    });
    expect(
      parsed.success,
      "portee incubateur acceptee avec un perimetre produit, la clef sera muette",
    ).to.be.false;
  });

  it("still accepts incubators:write on an incubator or global perimeter", async () => {
    const incubator = await db
      .selectFrom("incubators")
      .select("uuid")
      .where("ghid", "=", "pf-alpha")
      .executeTakeFirstOrThrow();

    for (const write_perimeter of [
      { kind: "incubator" as const, uuid: incubator.uuid },
      { kind: "global" as const },
    ]) {
      const parsed = apiKeyCreateSchema.safeParse({
        name: "clef legitime",
        kind: "personal",
        scopes: ["incubators:write", "startups:write"],
        read_perimeter: { kind: "global" },
        write_perimeter,
      });
      expect(parsed.success, write_perimeter.kind).to.be.true;
    }
  });

  // La liste d'ecriture ne doit jamais proposer ce que le submit refusera.
  it("keeps every write option acceptable to canUseWritePerimeter", async () => {
    const { canUseWritePerimeter } = await import("@/lib/authorization/apiKey");
    for (const username of Object.keys(EXPECTED)) {
      const subject = subjects.get(username)!;
      const options = await apiKeyPerimeterOptions(subject, subject.uuid);
      for (const incubator of options.write.incubators) {
        expect(
          await canUseWritePerimeter(subject, {
            kind: "incubator",
            uuid: incubator.uuid,
          }),
          `${username} / ${incubator.label}`,
        ).to.be.true;
      }
      for (const startup of options.write.startups) {
        expect(
          await canUseWritePerimeter(subject, {
            kind: "startup",
            uuid: startup.uuid,
          }),
          `${username} / ${startup.label}`,
        ).to.be.true;
      }
    }
  });
});
