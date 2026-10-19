import { expect } from "chai";

import {
  isUuid,
  resourceIdSchema,
  toMemberRef,
  toResourceRef,
} from "@/lib/api/identifier";

describe("api identifier", () => {
  it("reads a uuid as a uuid", () => {
    const uuid = "b3f0c1e2-1a2b-4c3d-8e9f-0a1b2c3d4e5f";
    expect(isUuid(uuid)).to.be.true;
    expect(toResourceRef(uuid)).to.deep.equal({ uuid });
    expect(toMemberRef(uuid)).to.deep.equal({ uuid });
  });

  it("reads anything else as a ghid or a username", () => {
    expect(toResourceRef("mon-produit")).to.deep.equal({ ghid: "mon-produit" });
    expect(toMemberRef("jean.dupont")).to.deep.equal({
      username: "jean.dupont",
    });
  });

  // Regle deterministe, documentee dans l'OpenAPI, sans repli d'une
  // interpretation sur l'autre.
  it("tests the uuid pattern FIRST: a ghid shaped like a uuid is read as a uuid", () => {
    const ghidShapedLikeUuid = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
    expect(toResourceRef(ghidShapedLikeUuid)).to.deep.equal({
      uuid: ghidShapedLikeUuid,
    });
    expect(toResourceRef(ghidShapedLikeUuid)).to.not.have.property("ghid");
  });

  it("accepts both forms in the runtime guard and rejects garbage", () => {
    expect(resourceIdSchema.safeParse("mon-produit").success).to.be.true;
    expect(
      resourceIdSchema.safeParse("b3f0c1e2-1a2b-4c3d-8e9f-0a1b2c3d4e5f").success,
    ).to.be.true;
    expect(resourceIdSchema.safeParse("espace membre").success).to.be.false;
    expect(resourceIdSchema.safeParse("../../etc/passwd").success).to.be.false;
  });

  it("is case insensitive on the uuid form", () => {
    expect(isUuid("B3F0C1E2-1A2B-4C3D-8E9F-0A1B2C3D4E5F")).to.be.true;
  });
});
