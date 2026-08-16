import { expect } from "chai";
import { z } from "zod";

import {
  collectionMetaSchema,
  jsonCollection,
  jsonItem,
  noContent,
} from "@/models/api/envelope";

const item = z.object({ uuid: z.string(), name: z.string() });

describe("api envelope", () => {
  it("wraps a single resource in { data }", async () => {
    const res = jsonItem(item, { uuid: "u", name: "n" });
    const body = await res.json();
    expect(body).to.have.all.keys("data");
    expect(body.data).to.deep.equal({ uuid: "u", name: "n" });
  });

  it("wraps a collection in { data, meta } with the perimeter as a ghid", async () => {
    const res = jsonCollection(item, [{ uuid: "u", name: "n" }], {
      total: 42,
      limit: 50,
      offset: 0,
      perimeter: "incubator/mon-incubateur",
    });
    const body = await res.json();
    expect(body).to.have.all.keys("data", "meta");
    expect(body.meta.total).to.equal(42);
    expect(body.meta.perimeter).to.equal("incubator/mon-incubateur");
  });

  // Le parse est fait ici et nulle part ailleurs : une route qui oublierait de
  // valider sa sortie ne peut pas exister.
  it("rejects a payload that does not match the item schema", () => {
    expect(() => jsonItem(item, { uuid: "u" })).to.throw();
    expect(() =>
      jsonCollection(item, [{ nope: true }], {
        total: 0,
        limit: 50,
        offset: 0,
        perimeter: "global",
      }),
    ).to.throw();
  });

  it("only accepts the three perimeter label forms", () => {
    const meta = { total: 0, limit: 50, offset: 0 };
    expect(collectionMetaSchema.safeParse({ ...meta, perimeter: "global" }).success)
      .to.be.true;
    expect(
      collectionMetaSchema.safeParse({ ...meta, perimeter: "startup/mon-produit" })
        .success,
    ).to.be.true;
    expect(
      collectionMetaSchema.safeParse({ ...meta, perimeter: "incubator/" }).success,
    ).to.be.false;
    expect(
      collectionMetaSchema.safeParse({ ...meta, perimeter: "whatever" }).success,
    ).to.be.false;
  });

  it("answers 204 without a body for a write without the matching read scope", async () => {
    const res = noContent();
    expect(res.status).to.equal(204);
    expect(await res.text()).to.equal("");
  });
});
