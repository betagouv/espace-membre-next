import { expect } from "chai";

import { getDimailUsernameForUser, isAttributaire } from "./utils";

const tests = [
  {
    title: "fonctionnaire",
    input: ["ada.lovelace", "fonctionnaire"],
    expected: "ada.lovelace",
  },
  {
    title: "contractuel",
    input: ["ada.lovelace", "contractuel"],
    expected: "ada.lovelace",
  },
  {
    title: "other",
    input: ["ada.lovelace", "pouet"],
    expected: "ada.lovelace.ext",
  },
  {
    title: "no legal_status, admin mission",
    input: ["ada.lovelace", null, "admin"],
    expected: "ada.lovelace",
  },
  {
    title: "no legal_status, independent mission",
    input: ["ada.lovelace", null, "independent"],
    expected: "ada.lovelace.ext",
  },
  {
    title: "no legal_status, no mission status",
    input: ["ada.lovelace", null, null],
    expected: "ada.lovelace.ext",
  },
  {
    title: "legal_status wins over mission status",
    input: ["ada.lovelace", "AE", "admin"],
    expected: "ada.lovelace.ext",
  },
  {
    title: "attributaire fonctionnaire : .ext anyway",
    input: ["ada.lovelace", "fonctionnaire", null, true],
    expected: "ada.lovelace.ext",
  },
  {
    title: "attributaire contractuel : .ext anyway",
    input: ["ada.lovelace", "contractuel", "admin", true],
    expected: "ada.lovelace.ext",
  },
  {
    title: "attributaire without legal_status and an admin mission : .ext anyway",
    input: ["ada.lovelace", null, "admin", true],
    expected: "ada.lovelace.ext",
  },
  {
    title: "attributaire independent",
    input: ["ada.lovelace", null, "independent", true],
    expected: "ada.lovelace.ext",
  },
];

describe("getDimailUsernameForUser", () => {
  tests.forEach((t) => {
    it(t.title, () => {
      expect(
        getDimailUsernameForUser.apply(
          this,
          t.input as [string, string | null, string | null, boolean],
        ),
      ).to.equal(t.expected);
    });
  });
});

describe("isAttributaire", () => {
  it("is true for the Attributaire domaine", () => {
    expect(isAttributaire({ domaine: "Attributaire", member_type: null })).to.be
      .true;
  });
  it("is true for the attributaire member type", () => {
    expect(
      isAttributaire({ domaine: "Développement", member_type: "attributaire" }),
    ).to.be.true;
  });
  it("is false otherwise", () => {
    expect(isAttributaire({ domaine: "Développement", member_type: "beta" })).to
      .be.false;
    expect(isAttributaire({})).to.be.false;
  });
});
