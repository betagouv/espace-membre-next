import { expect } from "chai";
import { subDays } from "date-fns";

import { createData, deleteData, FakeDataInterface } from "./utils/fakeData";
import { GET } from "@/app/api/protected/members/[username]/route";
import { db } from "@/lib/kysely";
import { Domaine } from "@/models/member";

// La fiche detaillee /api/protected/members/{username} est le successeur formalise
// de l'ancienne route /member/{username}. On verifie son contrat sur les points
// ajustes lors de la revue : missions[].startups en { uuid, ghid }, isCurrent
// correct pour une mission sans date de fin, et exposition assumee de la PII.
const testData: FakeDataInterface = {
  incubators: [{ ghid: "test-detail-incub", title: "Test Detail Incubateur" }],
  startups: [
    {
      ghid: "test-detail-startup",
      name: "Test Detail Startup",
      incubator: "test-detail-incub",
    },
  ],
  users: [
    {
      username: "test-detail-member",
      role: "Developpeuse",
      domaine: Domaine.DEVELOPPEMENT,
      // La mission (sans date de fin) est inseree directement en before : le
      // helper fakeData impose un end, or c'est justement le cas end=null qu'on
      // veut couvrir.
      missions: [],
    },
  ],
};

// La route ne lit pas la requete : un objet vide suffit.
const makeReq = () => ({}) as unknown as Request;

describe("GET /api/protected/members/[username]", () => {
  before(async () => {
    await createData(testData);
    const user = await db
      .selectFrom("users")
      .select("uuid")
      .where("username", "=", "test-detail-member")
      .executeTakeFirstOrThrow();
    const startup = await db
      .selectFrom("startups")
      .select("uuid")
      .where("ghid", "=", "test-detail-startup")
      .executeTakeFirstOrThrow();
    const mission = await db
      .insertInto("missions")
      .values({ start: subDays(new Date(), 30), end: null, user_id: user.uuid })
      .returningAll()
      .executeTakeFirstOrThrow();
    await db
      .insertInto("missions_startups")
      .values({ mission_id: mission.uuid, startup_id: startup.uuid })
      .execute();
  });

  after(async () => {
    await deleteData(testData);
  });

  it("renvoie 404 pour un membre inconnu", async () => {
    const res = await GET(makeReq(), {
      params: { username: "membre-inexistant" },
    });
    expect(res.status).to.equal(404);
  });

  it("expose les startups de mission en { uuid, ghid }", async () => {
    const res = await GET(makeReq(), {
      params: { username: "test-detail-member" },
    });
    expect(res.status).to.equal(200);
    const body = await res.json();

    expect(body.missions).to.have.length(1);
    const missionStartups = body.missions[0].startups;
    expect(missionStartups).to.have.length(1);
    expect(missionStartups[0].ghid).to.equal("test-detail-startup");
    expect(missionStartups[0].uuid).to.be.a("string");
  });

  it("isCurrent vaut true pour une mission sans date de fin", async () => {
    const res = await GET(makeReq(), {
      params: { username: "test-detail-member" },
    });
    const body = await res.json();
    const startup = body.startups.find(
      (s: { ghid: string | null }) => s.ghid === "test-detail-startup",
    );
    expect(startup, "startup presente").to.exist;
    expect(startup.isCurrent).to.equal(true);
  });

  it("expose la fiche detaillee (PII assumee : role, domaine, avatar, isActive)", async () => {
    const res = await GET(makeReq(), {
      params: { username: "test-detail-member" },
    });
    const body = await res.json();
    expect(body).to.have.property("role");
    expect(body).to.have.property("domaine");
    expect(body).to.have.property("avatar");
    expect(body).to.have.property("isActive");
    expect(body.role).to.equal("Developpeuse");
    expect(body.domaine).to.equal(Domaine.DEVELOPPEMENT);
  });
});
