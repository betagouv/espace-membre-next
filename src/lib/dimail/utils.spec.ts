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
];

describe("getDimailUsernameForUser", () => {
  tests.forEach((t) => {
    it(t.title, () => {
      expect(
        getDimailUsernameForUser.apply(this, t.input as [string, string]),
      ).to.equal(t.expected);
    });
  });
});
