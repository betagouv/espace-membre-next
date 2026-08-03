import { expect } from "chai";
import proxyquire from "proxyquire";

import { canValidateRestrictedChecklistItem as realFn } from "./canValidateRestrictedChecklistItem";

const load = (admins: string[], animation: string[]): typeof realFn =>
  proxyquire("@/lib/canValidateRestrictedChecklistItem", {
    "@/server/config/admin.config": {
      getAdmin: () => admins,
      "@noCallThru": true,
    },
    "@/server/config/animation.config": {
      getAnimation: () => animation,
      "@noCallThru": true,
    },
  }).canValidateRestrictedChecklistItem;

describe("canValidateRestrictedChecklistItem", () => {
  it("should allow a member of the animation team", () => {
    const fn = load([], ["jean.dupont"]);
    expect(fn("jean.dupont")).to.be.true;
  });

  it("should allow an admin even when not in the animation team", () => {
    const fn = load(["jean.dupont"], []);
    expect(fn("jean.dupont")).to.be.true;
  });

  it("should refuse a member in neither list", () => {
    const fn = load(["jean.dupont"], ["marie.martin"]);
    expect(fn("pierre.durand")).to.be.false;
  });

  it("should refuse when the username is missing", () => {
    const fn = load(["jean.dupont"], ["marie.martin"]);
    expect(fn(undefined)).to.be.false;
    expect(fn(null)).to.be.false;
    expect(fn("")).to.be.false;
  });
});
