import { expect } from "chai";
import proxyquire from "proxyquire";
import sinon from "sinon";

import { GET as listIncubators } from "@/app/api/v1/incubators/route";
import { db } from "@/lib/kysely";
import { EventCode } from "@/models/actionEvent/actionEvent";

import {
  apiRequest,
  apiWriteRequest,
  createTestApiKey,
  deleteTestApiKey,
} from "./utils/apiKey";
import { createData, deleteData, FakeDataInterface } from "./utils/fakeData";

const { PATCH: patchIncubator } = proxyquire(
  "@/app/api/v1/incubators/[id]/route",
  { "next/cache": { revalidatePath: sinon.stub() } },
) as typeof import("@/app/api/v1/incubators/[id]/route");

const testData: FakeDataInterface = {
  incubators: [
    { ghid: "hl-incub-a", title: "HL Incubateur A" },
    { ghid: "hl-incub-b", title: "HL Incubateur B" },
  ],
  startups: [
    {
      ghid: "hl-shared",
      name: "Produit co-incube",
      incubator: "hl-incub-a",
      incubators: ["hl-incub-b"],
    },
  ],
  users: [],
};

describe("api v1 incubators collection", () => {
  const created: string[] = [];
  let incubatorA: string;
  let startupUuid: string;

  const keyFor = async (
    scopes: Parameters<typeof createTestApiKey>[0]["scopes"],
    write?: { kind: "incubator" | "startup"; uuid: string },
  ) => {
    const key = await createTestApiKey({ scopes, write });
    created.push(key.uuid);
    return key;
  };

  before(async () => {
    await createData(testData);
    incubatorA = (
      await db
        .selectFrom("incubators")
        .select("uuid")
        .where("ghid", "=", "hl-incub-a")
        .executeTakeFirstOrThrow()
    ).uuid;
    startupUuid = (
      await db
        .selectFrom("startups")
        .select("uuid")
        .where("ghid", "=", "hl-shared")
        .executeTakeFirstOrThrow()
    ).uuid;
    // La colonne est renseignee : sans cela le defaut de projection reste
    // invisible, puisqu'une colonne NULL rend un tableau vide qui passe.
    await db
      .updateTable("incubators")
      .set({ highlighted_startups: [startupUuid] })
      .where("uuid", "=", incubatorA)
      .execute();
  });

  after(async () => {
    for (const uuid of created) await deleteTestApiKey(uuid);
    // Cible : les traces des PATCH de ce fichier, pas la table entiere. events
    // ne porte pas de colonne action_on_incubator, le code d'action est le seul
    // discriminant disponible.
    await db
      .deleteFrom("events")
      .where("action_code", "=", EventCode.INCUBATOR_API_UPDATED)
      .execute();
    await deleteData(testData);
  });

  /**
   * incubators.highlighted_startups est de type uuid[]. Un `startups.uuid::text`
   * faisait echouer la requete des la PLANIFICATION (operator does not exist:
   * text = uuid), donc la collection rendait 500 a chaque appel, meme sur une
   * base vide. Aucun test ne l'attrapait : les autres appels a cette route
   * s'arretent tous dans le wrapper, sur un 401 ou un 403.
   */
  it("answers 200, not 500, and resolves highlighted_startups", async () => {
    const key = await keyFor(["incubators:read"]);
    const res = await listIncubators(
      apiRequest(key.token, "http://localhost/api/v1/incubators?limit=100"),
      { params: Promise.resolve({}) },
    );
    expect(res.status, "la collection d'incubateurs est cassee").to.equal(200);

    const body = await res.json();
    const a = body.data.find(
      (incubator: { ghid: string }) => incubator.ghid === "hl-incub-a",
    );
    expect(a, "incubateur absent de la collection").to.exist;
    // Expose en ghid, et a plat : json_agg d'une valeur scalaire, pas d'une
    // ligne, sinon le schema de sortie rejette en 422.
    expect(a.highlighted_startups).to.deep.equal(["hl-shared"]);
    for (const ghid of a.highlighted_startups) {
      expect(ghid, "un objet est passe la ou un ghid est attendu").to.be.a(
        "string",
      );
    }
  });

  it("renders an incubator without highlighted startups as an empty array", async () => {
    const key = await keyFor(["incubators:read"]);
    const res = await listIncubators(
      apiRequest(key.token, "http://localhost/api/v1/incubators?limit=100"),
      { params: Promise.resolve({}) },
    );
    const body = await res.json();
    const b = body.data.find(
      (incubator: { ghid: string }) => incubator.ghid === "hl-incub-b",
    );
    expect(b.highlighted_startups).to.deep.equal([]);
  });

  /**
   * Un perimetre d'ecriture startup/S ne doit PAS ouvrir l'ecriture des
   * incubateurs de S : le porteur pourrait modifier la fiche d'un incubateur
   * dont il n'est membre d'aucune equipe, ce que le formulaire web lui refuse.
   */
  it("refuses to write an incubator from a startup write perimeter", async () => {
    const key = await keyFor(["incubators:write", "incubators:read"], {
      kind: "startup",
      uuid: startupUuid,
    });
    const res = await patchIncubator(
      apiWriteRequest(
        key.token,
        "http://localhost/api/v1/incubators/hl-incub-a",
        "PATCH",
        "application/merge-patch+json",
        { title: "Titre pris par escalade" },
      ),
      { params: Promise.resolve({ id: "hl-incub-a" }) },
    );
    expect(res.status, "escalade : ecriture acceptee hors perimetre").to.equal(
      403,
    );

    const untouched = await db
      .selectFrom("incubators")
      .select("title")
      .where("uuid", "=", incubatorA)
      .executeTakeFirstOrThrow();
    expect(untouched.title).to.equal("HL Incubateur A");
  });

  it("still allows the write from an incubator write perimeter", async () => {
    const key = await keyFor(["incubators:write", "incubators:read"], {
      kind: "incubator",
      uuid: incubatorA,
    });
    const res = await patchIncubator(
      apiWriteRequest(
        key.token,
        "http://localhost/api/v1/incubators/hl-incub-a",
        "PATCH",
        "application/merge-patch+json",
        { title: "HL Incubateur A" },
      ),
      { params: Promise.resolve({ id: "hl-incub-a" }) },
    );
    expect(res.status).to.equal(200);
  });
});
