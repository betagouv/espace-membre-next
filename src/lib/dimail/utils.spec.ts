import { expect } from "chai";

import { getDimailUsernameForUser } from "./utils";

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
];

describe("getDimailUsernameForUser", () => {
  tests.forEach((t) => {
    it(t.title, () => {
      expect(
        getDimailUsernameForUser.apply(
          this,
          t.input as [string, string | null, string | null],
        ),
      ).to.equal(t.expected);
    });
  });
});
