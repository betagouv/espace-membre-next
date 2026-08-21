import fs from "fs";
import path from "path";

import { expect } from "chai";
import { addDays, subDays } from "date-fns";
import { NextRequest } from "next/server";
import proxyquire from "proxyquire";
import sinon from "sinon";

import { GET as listIncubatorMembers } from "@/app/api/v1/incubators/[id]/members/route";
import { GET as getIncubator } from "@/app/api/v1/incubators/[id]/route";
import { GET as listIncubatorStartups } from "@/app/api/v1/incubators/[id]/startups/route";
import { GET as listIncubators } from "@/app/api/v1/incubators/route";
import { GET as getMember } from "@/app/api/v1/members/[id]/route";
import { GET as listMembers } from "@/app/api/v1/members/route";
import { GET as getOpenApi } from "@/app/api/v1/openapi.json/route";
import { GET as listStartupMembers } from "@/app/api/v1/startups/[id]/members/route";
import { GET as getStartup } from "@/app/api/v1/startups/[id]/route";
import { GET as listStartups } from "@/app/api/v1/startups/route";
import { db } from "@/lib/kysely";
import { EventCode } from "@/models/actionEvent/actionEvent";

import {
  apiRequest,
  apiWriteRequest,
  createTestApiKey,
  deleteTestApiKey,
} from "./utils/apiKey";
import { createData, deleteData, FakeDataInterface } from "./utils/fakeData";

const noCache = { "next/cache": { revalidatePath: sinon.stub() } };
const { PATCH: patchIncubator } = proxyquire(
  "@/app/api/v1/incubators/[id]/route",
  noCache,
) as typeof import("@/app/api/v1/incubators/[id]/route");
const { PATCH: patchStartup } = proxyquire(
  "@/app/api/v1/startups/[id]/route",
  noCache,
) as typeof import("@/app/api/v1/startups/[id]/route");
const { PUT: putStandards, PATCH: patchStandards } = proxyquire(
  "@/app/api/v1/startups/[id]/standards/route",
  noCache,
) as typeof import("@/app/api/v1/startups/[id]/standards/route");

const now = new Date();

const testData: FakeDataInterface = {
  incubators: [{ ghid: "smoke-incub", title: "Fumee" }],
  startups: [
    { ghid: "smoke-startup", name: "Produit fumee", incubator: "smoke-incub" },
  ],
  users: [
    {
      username: "smoke-member",
      fullname: "Membre fumee",
      missions: [
        {
          start: subDays(now, 10),
          end: addDays(now, 10),
          startups: ["smoke-startup"],
        },
      ],
    },
  ],
};

const params = <P>(value: P) => ({ params: Promise.resolve(value) });

const API_V1_DIR = path.join(process.cwd(), "src/app/api/v1");

function listRouteFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listRouteFiles(full);
    return entry.name === "route.ts" ? [path.relative(API_V1_DIR, full)] : [];
  });
}

/**
 * Une route est couverte si ce fichier importe son module, ou s'il cite son
 * chemin d'URL, ce qui est le cas des deux routes publiques appelees sans clef.
 */
export function uncoveredRoutes(files: string[], source: string): string[] {
  return files.filter((file) => {
    const segment = path.dirname(file);
    return (
      !source.includes(`@/app/api/v1/${segment}/route`) &&
      !source.includes(`/api/v1/${segment}`)
    );
  });
}

/**
 * Chaque route de src/app/api/v1 est appelee ici avec une VRAIE clef et doit
 * rendre un 2xx. C'est exactement le trou qui avait laisse passer un 500
 * permanent sur GET /api/v1/incubators : la route n'etait touchee que par des
 * tests qui s'arretaient dans le wrapper, en 401 ou en 403, sans jamais
 * atteindre son handler.
 */
describe("api v1 smoke", () => {
  const keys: string[] = [];
  let token: string;

  before(async () => {
    await createData(testData);
    const key = await createTestApiKey({
      scopes: [
        "members:read",
        "startups:read",
        "incubators:read",
        "startups:write",
        "incubators:write",
      ],
      write: { kind: "global" },
    });
    keys.push(key.uuid);
    token = key.token;
  });

  after(async () => {
    for (const uuid of keys) await deleteTestApiKey(uuid);
    await db
      .deleteFrom("events")
      .where("action_code", "in", [
        EventCode.INCUBATOR_API_UPDATED,
        EventCode.STARTUP_API_UPDATED,
        EventCode.STARTUP_STANDARDS_UPDATED,
      ])
      .execute();
    await deleteData(testData);
  });

  const get = (url: string) => apiRequest(token, `http://localhost${url}`);

  it("GET /api/v1/incubators", async () => {
    const res = await listIncubators(
      get("/api/v1/incubators?limit=100"),
      params({}),
    );
    expect(res.status).to.equal(200);
  });

  it("GET /api/v1/incubators/{id}", async () => {
    const res = await getIncubator(
      get("/api/v1/incubators/smoke-incub"),
      params({ id: "smoke-incub" }),
    );
    expect(res.status).to.equal(200);
  });

  it("PATCH /api/v1/incubators/{id}", async () => {
    const res = await patchIncubator(
      apiWriteRequest(
        token,
        "http://localhost/api/v1/incubators/smoke-incub",
        "PATCH",
        "application/merge-patch+json",
        { description: "Description posee par le test de fumee" },
      ),
      params({ id: "smoke-incub" }),
    );
    expect(res.status).to.equal(200);
  });

  it("GET /api/v1/incubators/{id}/startups", async () => {
    const res = await listIncubatorStartups(
      get("/api/v1/incubators/smoke-incub/startups?limit=100"),
      params({ id: "smoke-incub" }),
    );
    expect(res.status).to.equal(200);
  });

  it("GET /api/v1/incubators/{id}/members", async () => {
    const res = await listIncubatorMembers(
      get("/api/v1/incubators/smoke-incub/members?limit=100"),
      params({ id: "smoke-incub" }),
    );
    expect(res.status).to.equal(200);
  });

  it("GET /api/v1/startups", async () => {
    const res = await listStartups(
      get("/api/v1/startups?limit=100"),
      params({}),
    );
    expect(res.status).to.equal(200);
  });

  it("GET /api/v1/startups/{id}", async () => {
    const res = await getStartup(
      get("/api/v1/startups/smoke-startup"),
      params({ id: "smoke-startup" }),
    );
    expect(res.status).to.equal(200);
  });

  it("PATCH /api/v1/startups/{id}", async () => {
    const res = await patchStartup(
      apiWriteRequest(
        token,
        "http://localhost/api/v1/startups/smoke-startup",
        "PATCH",
        "application/merge-patch+json",
        { pitch: "Pitch pose par le test de fumee" },
      ),
      params({ id: "smoke-startup" }),
    );
    expect(res.status).to.equal(200);
  });

  it("PUT /api/v1/startups/{id}/standards", async () => {
    const res = await putStandards(
      apiWriteRequest(
        token,
        "http://localhost/api/v1/startups/smoke-startup/standards",
        "PUT",
        "application/json",
        {
          accessibility_status: "partiellement conforme",
          dsfr_status: null,
          mon_service_securise: null,
          analyse_risques: null,
          analyse_risques_url: null,
          dashlord_url: null,
          tech_audit_url: null,
          ecodesign_url: null,
          stats: null,
          stats_url: null,
        },
      ),
      params({ id: "smoke-startup" }),
    );
    expect(res.status).to.equal(200);
  });

  it("PATCH /api/v1/startups/{id}/standards", async () => {
    const res = await patchStandards(
      apiWriteRequest(
        token,
        "http://localhost/api/v1/startups/smoke-startup/standards",
        "PATCH",
        "application/merge-patch+json",
        { stats: true },
      ),
      params({ id: "smoke-startup" }),
    );
    expect(res.status).to.equal(200);
  });

  it("GET /api/v1/startups/{id}/members", async () => {
    const res = await listStartupMembers(
      get("/api/v1/startups/smoke-startup/members?limit=100"),
      params({ id: "smoke-startup" }),
    );
    expect(res.status).to.equal(200);
  });

  it("GET /api/v1/members", async () => {
    const res = await listMembers(get("/api/v1/members?limit=100"), params({}));
    expect(res.status).to.equal(200);
    const body = (await res.json()) as { data: { username: string }[] };
    expect(body.data.map((member) => member.username)).to.include(
      "smoke-member",
    );
  });

  it("GET /api/v1/members/{id}", async () => {
    const res = await getMember(
      get("/api/v1/members/smoke-member"),
      params({ id: "smoke-member" }),
    );
    expect(res.status).to.equal(200);
  });

  // La seule route publique restante : aucune clef, mais elle doit rendre.
  // La page de documentation a quitte /api/v1 pour /api/docs, ce n'est plus
  // une route mais une page, hors du perimetre de ce fichier.
  it("GET /api/v1/openapi.json", async () => {
    const res = await getOpenApi(
      new NextRequest("http://localhost/api/v1/openapi.json"),
    );
    expect(res.status).to.equal(200);
    const document = (await res.json()) as { openapi: string };
    expect(document.openapi).to.match(/^3\.1/);
  });

  /**
   * La garde du trou : si une route apparait sous src/app/api/v1 sans ligne
   * dans ce fichier, elle n'est exercee par rien et le test echoue.
   */
  it("covers every route file of src/app/api/v1", () => {
    const onDisk = listRouteFiles(API_V1_DIR).sort();
    const source = fs.readFileSync(__filename, "utf-8");

    expect(
      uncoveredRoutes(onDisk, source),
      "routes sans appel dans ce fichier",
    ).to.deep.equal([]);
    expect(onDisk.length, "le compte de routes a change").to.equal(11);
  });

  // La garde doit echouer sur une route non couverte, sinon elle ne garde rien.
  it("fails on a route file that no line of this file calls", () => {
    const source = fs.readFileSync(__filename, "utf-8");
    expect(uncoveredRoutes(["members/route.ts"], source)).to.deep.equal([]);
    expect(
      uncoveredRoutes(["incubators/[id]/teams/route.ts"], source),
    ).to.deep.equal(["incubators/[id]/teams/route.ts"]);
  });
});
