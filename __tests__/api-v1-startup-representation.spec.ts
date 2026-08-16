import { expect } from "chai";
import proxyquire from "proxyquire";
import sinon from "sinon";

import { GET as getStartup } from "@/app/api/v1/startups/[id]/route";
import { GET as listIncubatorStartups } from "@/app/api/v1/incubators/[id]/startups/route";
import { GET as listStartups } from "@/app/api/v1/startups/route";
import { db } from "@/lib/kysely";

import {
  apiRequest,
  apiWriteRequest,
  createTestApiKey,
  deleteTestApiKey,
} from "./utils/apiKey";
import { createData, deleteData, FakeDataInterface } from "./utils/fakeData";

const { PUT: putStandards, PATCH: patchStandards } = proxyquire(
  "@/app/api/v1/startups/[id]/standards/route",
  { "next/cache": { revalidatePath: sinon.stub() } },
) as typeof import("@/app/api/v1/startups/[id]/standards/route");

// Le produit est cree sans pitch, sans contact, sans description et sans
// dsfr_status : ces colonnes restent a NULL, ce que les schemas de sortie
// declarent tous en .nullable().
const testData: FakeDataInterface = {
  incubators: [{ ghid: "srep-incub", title: "Representation" }],
  startups: [
    {
      ghid: "srep-startup",
      name: "Produit sans pitch",
      incubator: "srep-incub",
    },
  ],
  users: [],
};

type Startup = {
  uuid: string;
  ghid: string;
  pitch: string | null;
  contact?: string | null;
  description?: string | null;
  dsfr_status?: string | null;
};

describe("api v1 startup representation", () => {
  const keys: string[] = [];
  let token: string;

  before(async () => {
    await createData(testData);
    const key = await createTestApiKey({
      scopes: ["startups:read", "startups:write"],
      write: { kind: "global" },
    });
    keys.push(key.uuid);
    token = key.token;
  });

  after(async () => {
    for (const uuid of keys) await deleteTestApiKey(uuid);
    // events.action_on_startup est en RESTRICT : les traces d'ecriture de ce
    // fichier doivent partir avant le produit. Suppression ciblee, pas une
    // troncature de la table, qui emporterait les traces des autres fichiers.
    await db
      .deleteFrom("events")
      .where((eb) =>
        eb.exists(
          eb
            .selectFrom("startups")
            .select("startups.uuid")
            .whereRef("startups.uuid", "=", "events.action_on_startup")
            .where("startups.ghid", "=", "srep-startup"),
        ),
      )
      .execute();
    await deleteData(testData);
  });

  const detail = async () => {
    const res = await getStartup(
      apiRequest(token, "http://localhost/api/v1/startups/srep-startup"),
      { params: Promise.resolve({ id: "srep-startup" }) },
    );
    expect(res.status, "GET /api/v1/startups/{id}").to.equal(200);
    return ((await res.json()) as { data: Startup }).data;
  };

  const collection = async () => {
    const res = await listStartups(
      apiRequest(token, "http://localhost/api/v1/startups?limit=100"),
      { params: Promise.resolve({}) },
    );
    expect(res.status, "GET /api/v1/startups").to.equal(200);
    const body = (await res.json()) as { data: Startup[] };
    return body.data.find((startup) => startup.ghid === "srep-startup")!;
  };

  const byIncubator = async () => {
    const res = await listIncubatorStartups(
      apiRequest(
        token,
        "http://localhost/api/v1/incubators/srep-incub/startups?limit=100",
      ),
      { params: Promise.resolve({ id: "srep-incub" }) },
    );
    expect(res.status, "GET /api/v1/incubators/{id}/startups").to.equal(200);
    const body = (await res.json()) as { data: Startup[] };
    return body.data.find((startup) => startup.ghid === "srep-startup")!;
  };

  /**
   * startupToModel coerce pitch, contact, description et dsfr_status en chaine
   * vide : c'est le modele du site web, dont le schema exige des chaines. Les
   * schemas de l'API declarent ces champs .nullable() et les deux autres routes
   * produit rendent la valeur reelle. Le meme produit se lisait donc
   * differemment selon la route.
   */
  it("renders a NULL column as null, on the detail as on the collection", async () => {
    const one = await detail();
    const listed = await collection();

    expect(one.pitch, "detail : NULL rendu en chaine vide").to.be.null;
    expect(one.contact).to.be.null;
    expect(one.description).to.be.null;
    expect(one.dsfr_status).to.be.null;
    expect(listed.pitch, "collection : NULL rendu en chaine vide").to.be.null;
  });

  it("agrees with the incubator sub-resource on the same product", async () => {
    const one = await detail();
    const nested = await byIncubator();
    expect(nested.pitch).to.equal(one.pitch);
    expect(nested.uuid).to.equal(one.uuid);
  });

  /**
   * Le cycle lire-modifier-ecrire que revendique le modele des standards : ce
   * qu'un client relit et renvoie tel quel ne doit rien ecraser. Avec une
   * chaine vide a la lecture, le PUT persistait "" a la place de NULL.
   */
  it("keeps NULL through a read-modify-write cycle on the standards", async () => {
    const before = await detail();
    const res = await putStandards(
      apiWriteRequest(
        token,
        "http://localhost/api/v1/startups/srep-startup/standards",
        "PUT",
        "application/json",
        {
          accessibility_status: null,
          dsfr_status: before.dsfr_status ?? null,
          mon_service_securise: null,
          analyse_risques: null,
          analyse_risques_url: null,
          dashlord_url: null,
          tech_audit_url: null,
          ecodesign_url: null,
          stats: null,
          stats_url: "https://stats.example.gouv.fr",
        },
      ),
      { params: Promise.resolve({ id: "srep-startup" }) },
    );
    expect(res.status, "PUT /api/v1/startups/{id}/standards").to.equal(200);
    const body = (await res.json()) as {
      data: Startup & { stats_url: string };
    };
    expect(body.data.stats_url).to.equal("https://stats.example.gouv.fr");
    expect(
      body.data.dsfr_status,
      "une chaine vide a ete persistee a la place de NULL",
    ).to.be.null;
  });

  it("answers 200 on a merge-patch of the standards", async () => {
    const res = await patchStandards(
      apiWriteRequest(
        token,
        "http://localhost/api/v1/startups/srep-startup/standards",
        "PATCH",
        "application/merge-patch+json",
        { dashlord_url: "https://dashlord.example.gouv.fr" },
      ),
      { params: Promise.resolve({ id: "srep-startup" }) },
    );
    expect(res.status, "PATCH /api/v1/startups/{id}/standards").to.equal(200);
    const body = (await res.json()) as {
      data: { dashlord_url: string; stats_url: string };
    };
    expect(body.data.dashlord_url).to.equal("https://dashlord.example.gouv.fr");
    // RFC 7396 : un champ absent conserve sa valeur.
    expect(body.data.stats_url).to.equal("https://stats.example.gouv.fr");
  });
});
