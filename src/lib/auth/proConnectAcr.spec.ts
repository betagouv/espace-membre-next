import { expect } from "chai";
import jwt from "jsonwebtoken";

import {
  hasRequiredProConnectAcr,
  proConnectAcrClaims,
  PROCONNECT_MFA_ACR_VALUES,
} from "@/lib/auth/proConnectAcr";

const idTokenWith = (claims: Record<string, unknown>) =>
  jwt.sign({ sub: "abc", ...claims }, "test-secret");

describe("ProConnect acr (double authentication)", () => {
  it("asks for the MFA levels as an essential claim of the id_token", () => {
    expect(JSON.parse(proConnectAcrClaims())).to.deep.equal({
      id_token: {
        acr: {
          essential: true,
          values: ["eidas0-mfa", "eidas1-mfa", "eidas2", "eidas3"],
        },
      },
    });
  });

  it("accepts every MFA level", () => {
    PROCONNECT_MFA_ACR_VALUES.forEach((acr) => {
      expect(hasRequiredProConnectAcr(idTokenWith({ acr })), acr).to.be.true;
    });
  });

  it("refuses a level without a second factor", () => {
    ["eidas1", "eidas0", "something-else"].forEach((acr) => {
      expect(hasRequiredProConnectAcr(idTokenWith({ acr })), acr).to.be.false;
    });
  });

  it("refuses an id_token without acr, or with a non-string acr", () => {
    expect(hasRequiredProConnectAcr(idTokenWith({}))).to.be.false;
    expect(hasRequiredProConnectAcr(idTokenWith({ acr: ["eidas2"] }))).to.be
      .false;
  });

  it("refuses a missing or unreadable id_token", () => {
    expect(hasRequiredProConnectAcr(undefined)).to.be.false;
    expect(hasRequiredProConnectAcr(null)).to.be.false;
    expect(hasRequiredProConnectAcr("not-a-jwt")).to.be.false;
  });
});
