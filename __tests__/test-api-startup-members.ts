import { expect } from "chai";
import { addDays, subDays } from "date-fns";

import { apiRequest, createTestApiKey, deleteTestApiKey } from "./utils/apiKey";
import { createData, deleteData, FakeDataInterface } from "./utils/fakeData";
import { GET } from "@/app/api/v1/startups/[id]/members/route";

const now = new Date();

const testData: FakeDataInterface = {
  incubators: [{ ghid: "test-sm-incub", title: "Test SM Incubateur" }],
  startups: [
    {
      ghid: "test-sm-startup",
      name: "Test SM Startup",
      incubator: "test-sm-incub",
    },
  ],
  users: [
    {
      username: "test-sm-member",
      role: "Developpeuse",
      missions: [
        {
          start: subDays(now, 30),
          end: addDays(now, 30),
          startups: ["test-sm-startup"],
        },
      ],
    },
  ],
};

// Les routes v1 passent par withApiV1 : une VRAIE clef est inseree en base et
// le jeton voyage en Bearer, donc le test traverse aussi le perimetre.
let apiKey: { token: string; uuid: string };
const makeReq = (search = "") =>
  apiRequest(
    apiKey.token,
    `http://localhost:3000/api/v1/resource${search ? `?${search}` : ""}`,
  );

describe("GET /api/v1/startups/[ghid]/members", () => {
  before(async () => {
    apiKey = await createTestApiKey({ scopes: ["members:read"] });
    await createData(testData);
  });

  after(async () => {
    await deleteTestApiKey(apiKey.uuid);
    await deleteData(testData);
  });

  it("renvoie 404 pour une startup inconnue", async () => {
    const res = await GET(makeReq(), {
      params: Promise.resolve({ id: "startup-inexistante" }),
    });
    expect(res.status).to.equal(404);
  });

  it("renvoie les membres de la startup avec missions[].startups en { uuid, ghid }", async () => {
    const res = await GET(makeReq(), { params: Promise.resolve({ id: "test-sm-startup" }) });
    expect(res.status).to.equal(200);
    const body = (await res.json()).data;

    const member = body.find(
      (m: { username: string }) => m.username === "test-sm-member",
    );
    expect(member, "membre présent").to.exist;

    const missionStartups = member.missions[0].startups;
    expect(missionStartups).to.have.length(1);
    expect(missionStartups[0].ghid).to.equal("test-sm-startup");
    expect(missionStartups[0].uuid).to.be.a("string");
  });

  it("n'expose pas les champs exclus (bio, domaine, role, etc.)", async () => {
    const res = await GET(makeReq(), { params: Promise.resolve({ id: "test-sm-startup" }) });
    const body = (await res.json()).data;
    const member = body[0];

    for (const excluded of [
      "bio",
      "competences",
      "domaine",
      "link",
      "role",
      "legal_status",
      "workplace_insee_code",
      "member_type",
      "attachment",
      "teams",
    ]) {
      expect(member).to.not.have.property(excluded);
    }
  });
});
