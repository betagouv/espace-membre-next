import { expect } from "chai";
import { addDays, subDays } from "date-fns";
import { NextRequest } from "next/server";

import { createData, deleteData, FakeDataInterface } from "./utils/fakeData";
import { GET } from "@/app/api/protected/incubators/[ghid]/members/route";
import { IncubatorMemberAttachment } from "@/models/api/member";

const now = new Date();

// Jeu de donnees couvrant les deux chemins de rattachement a l'incubateur :
// - par startup (mission active ou terminee),
// - par equipe,
// - par les deux.
const testData: FakeDataInterface = {
  incubators: [{ ghid: "test-api-incub", title: "Test API Incubateur" }],
  startups: [
    {
      ghid: "test-api-startup",
      name: "Test API Startup",
      incubator: "test-api-incub",
    },
  ],
  teams: [
    {
      ghid: "test-api-team",
      name: "Test API Team",
      incubator: "test-api-incub",
    },
  ],
  users: [
    {
      username: "test-api-startup-active",
      missions: [
        {
          start: subDays(now, 30),
          end: addDays(now, 30),
          startups: ["test-api-startup"],
        },
      ],
    },
    {
      username: "test-api-startup-ended",
      missions: [
        {
          start: subDays(now, 60),
          end: subDays(now, 10),
          startups: ["test-api-startup"],
        },
      ],
    },
    {
      username: "test-api-team-only",
      teams: ["test-api-team"],
      missions: [{ start: subDays(now, 60), end: subDays(now, 10) }],
    },
    {
      username: "test-api-both",
      teams: ["test-api-team"],
      missions: [
        {
          start: subDays(now, 30),
          end: addDays(now, 30),
          startups: ["test-api-startup"],
        },
      ],
    },
  ],
};

// Le handler ne lit que req.nextUrl.searchParams : un mock minimal suffit.
const makeReq = (search = "") =>
  ({
    nextUrl: { searchParams: new URLSearchParams(search) },
  }) as unknown as NextRequest;

describe("GET /api/protected/incubators/[ghid]/members", () => {
  before(async () => {
    await createData(testData);
  });

  after(async () => {
    await deleteData(testData);
  });

  it("renvoie 404 pour un incubateur inconnu", async () => {
    const res = await GET(makeReq(), {
      params: Promise.resolve({ ghid: "incubateur-inexistant" }),
    });
    expect(res.status).to.equal(404);
  });

  it("renvoie par defaut tous les rattaches, missions terminees comprises", async () => {
    const res = await GET(makeReq(), { params: Promise.resolve({ ghid: "test-api-incub" }) });
    expect(res.status).to.equal(200);
    const body = await res.json();

    const usernames = body.map(
      (member: { username: string }) => member.username,
    );
    expect(usernames).to.include.members([
      "test-api-startup-active",
      "test-api-startup-ended",
      "test-api-team-only",
      "test-api-both",
    ]);
  });

  it("expose le discriminant attachment et les GHID de startups des missions", async () => {
    const res = await GET(makeReq(), { params: Promise.resolve({ ghid: "test-api-incub" }) });
    const body = await res.json();
    const byUsername = Object.fromEntries(
      body.map((member: { username: string }) => [member.username, member]),
    );

    expect(byUsername["test-api-startup-active"].attachment).to.equal(
      IncubatorMemberAttachment.STARTUPS,
    );
    expect(byUsername["test-api-team-only"].attachment).to.equal(
      IncubatorMemberAttachment.TEAMS,
    );
    expect(byUsername["test-api-both"].attachment).to.equal(
      IncubatorMemberAttachment.BOTH,
    );

    // Chaque startup de mission est exposee par son couple { uuid, ghid }.
    const missionStartups =
      byUsername["test-api-startup-active"].missions[0].startups;
    expect(missionStartups).to.have.length(1);
    expect(missionStartups[0].ghid).to.equal("test-api-startup");
    expect(missionStartups[0].uuid).to.be.a("string");
    // L'appartenance a une equipe de l'incubateur est exposee par GHID.
    expect(byUsername["test-api-team-only"].teams).to.deep.equal([
      "test-api-team",
    ]);
  });

  it("n'expose pas les champs exclus (bio, domaine, role, avatar, etc.)", async () => {
    const res = await GET(makeReq(), { params: Promise.resolve({ ghid: "test-api-incub" }) });
    const body = await res.json();
    const member = body[0];

    expect(member).to.include.keys([
      "uuid",
      "username",
      "fullname",
      "github",
      "primary_email",
      "secondary_email",
      "communication_email",
      "primary_email_status",
      "attachment",
      "teams",
      "missions",
    ]);
    for (const excluded of [
      "bio",
      "competences",
      "domaine",
      "link",
      "role",
      "legal_status",
      "workplace_insee_code",
      "member_type",
      "avatar",
    ]) {
      expect(member).to.not.have.property(excluded);
    }
  });

  it("filtre les membres inactifs avec ?status=active", async () => {
    const res = await GET(makeReq("status=active"), {
      params: Promise.resolve({ ghid: "test-api-incub" }),
    });
    expect(res.status).to.equal(200);
    const body = await res.json();
    const usernames = body.map(
      (member: { username: string }) => member.username,
    );

    // Le membre dont la seule mission est terminee et qui n'est rattache que par
    // startup disparait ; les membres actifs et les membres d'equipe restent.
    expect(usernames).to.not.include("test-api-startup-ended");
    expect(usernames).to.include.members([
      "test-api-startup-active",
      "test-api-team-only",
      "test-api-both",
    ]);
  });
});
