import { expect } from "chai";

import {
  DEFAULT_LIMIT,
  MAX_LIMIT,
  parsePagination,
} from "@/lib/api/pagination";

const parse = (query: string) => parsePagination(new URLSearchParams(query));

describe("api pagination", () => {
  it("applies the defaults when no parameter is given", () => {
    const result = parse("");
    expect(result.success).to.be.true;
    expect(result.success && result.data).to.deep.equal({
      limit: DEFAULT_LIMIT,
      offset: 0,
    });
  });

  /**
   * searchParams.get() rend null, et z.coerce.number() transformerait ce null en
   * 0 : sans la lecture parametre par parametre, toute requete sans pagination
   * repondrait 422 sur /limit.
   */
  it("never turns a missing parameter into 0", () => {
    const result = parse("");
    expect(result.success && result.data.limit).to.equal(DEFAULT_LIMIT);
    expect(result.success && result.data.limit).to.not.equal(0);
  });

  it("caps limit at 100 and points at the faulty field", () => {
    const result = parse(`limit=${MAX_LIMIT + 1}`);
    expect(result.success).to.be.false;
    const pointers = !result.success
      ? result.error.issues.map((issue) => `/${issue.path.join("/")}`)
      : [];
    expect(pointers).to.include("/limit");
  });

  it("rejects limit=0 and a negative offset", () => {
    expect(parse("limit=0").success).to.be.false;
    expect(parse("offset=-1").success).to.be.false;
  });

  /**
   * Sans borne haute, un offset hors intervalle bigint atteint Postgres et rend
   * 500, la ou un parametre de pagination invalide doit rendre 422.
   */
  it("caps offset so an out-of-range value is a 422, never a 500", () => {
    for (const raw of ["1e21", "99999999999999999999", "9223372036854775808"]) {
      const result = parse(`offset=${raw}`);
      expect(result.success, `offset=${raw} accepte`).to.be.false;
      const pointers = !result.success
        ? result.error.issues.map((issue) => `/${issue.path.join("/")}`)
        : [];
      expect(pointers).to.include("/offset");
    }
    expect(parse("offset=9007199254740991").success).to.be.true;
  });

  it("accepts the boundaries", () => {
    expect(parse("limit=1&offset=0").success).to.be.true;
    const max = parse(`limit=${MAX_LIMIT}`);
    expect(max.success && max.data.limit).to.equal(MAX_LIMIT);
  });

  it("coerces the strings sent on the query string", () => {
    const result = parse("limit=10&offset=20");
    expect(result.success && result.data).to.deep.equal({
      limit: 10,
      offset: 20,
    });
  });
});
