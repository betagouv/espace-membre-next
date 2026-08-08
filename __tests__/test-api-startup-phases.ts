import { expect } from "chai";
import { NextRequest } from "next/server";

import { createData, deleteData, FakeDataInterface } from "./utils/fakeData";
import { GET as getStartups } from "@/app/api/protected/startups/route";
import { db } from "@/lib/kysely";

const testData: FakeDataInterface = {
  incubators: [{ ghid: "test-phase-incub", title: "Test Phase Incubateur" }],
  startups: [
    {
      ghid: "test-phase-startup",
      name: "Test Phase Startup",
      incubator: "test-phase-incub",
    },
  ],
};

// Le handler ne lit que req.nextUrl.searchParams : un mock minimal suffit.
const makeReq = (search = "") =>
  ({
    nextUrl: { searchParams: new URLSearchParams(search) },
  }) as unknown as NextRequest;

type ApiStartup = {
  ghid: string;
  phases: Array<{ name: string; start: string; end: string | null }>;
  current_phase: string | null;
};

const findStartup = (body: ApiStartup[]) =>
  body.find((startup) => startup.ghid === "test-phase-startup");

describe("GET /api/protected/startups (phases)", () => {
  before(async () => {
    await createData(testData);
    // createData crée une phase "acceleration" à maintenant. On ajoute une phase
    // terminale plus récente pour vérifier l'ordre chronologique et la phase
    // courante.
    const startup = await db
      .selectFrom("startups")
      .select("uuid")
      .where("ghid", "=", "test-phase-startup")
      .executeTakeFirstOrThrow();
    await db
      .insertInto("phases")
      .values({
        startup_id: startup.uuid,
        name: "abandon",
        start: new Date(Date.now() + 24 * 60 * 60 * 1000),
      })
      .execute();
  });

  after(async () => {
    await deleteData(testData);
  });

  it("expose les phases ordonnées chronologiquement et la phase courante", async () => {
    const res = await getStartups(makeReq());
    expect(res.status).to.equal(200);
    const startup = findStartup(await res.json());
    expect(startup, "startup présente dans la réponse").to.exist;
    expect(startup!.phases.map((phase) => phase.name)).to.deep.equal([
      "acceleration",
      "abandon",
    ]);
    expect(startup!.current_phase).to.equal("abandon");
  });

  it("filtre par ?phase sans filtre par défaut", async () => {
    const all = findStartup(await (await getStartups(makeReq())).json());
    expect(all, "présente sans filtre").to.exist;

    const matching = findStartup(
      await (await getStartups(makeReq("phase=abandon"))).json(),
    );
    expect(matching, "présente quand la phase courante correspond").to.exist;

    const notMatching = findStartup(
      await (await getStartups(makeReq("phase=construction"))).json(),
    );
    expect(notMatching, "absente quand la phase courante ne correspond pas").to
      .be.undefined;
  });
});
