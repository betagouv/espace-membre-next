import { expect } from "chai";
import proxyquire from "proxyquire";

import {
  ANIMATION_TEAM_GHID,
  canValidateRestrictedChecklistItem as realFn,
} from "./canValidateRestrictedChecklistItem";

type Team = { ghid: string | null };

const load = (admins: string[], teams: Team[]): typeof realFn =>
  proxyquire("@/lib/canValidateRestrictedChecklistItem", {
    "@/server/config/admin.config": {
      getAdmin: () => admins,
      "@noCallThru": true,
    },
    "@/lib/kysely/queries/teams": {
      getTeamsForUser: async () => teams,
      "@noCallThru": true,
    },
  }).canValidateRestrictedChecklistItem;

const sessionUser = (username: string) =>
  ({
    id: username,
    uuid: "3f1b1c1e-0000-4000-8000-000000000001",
    email: `${username}@beta.gouv.fr`,
    isAdmin: false,
  }) as any;

describe("canValidateRestrictedChecklistItem", () => {
  it("should allow a member of the animation team", async () => {
    const fn = load([], [{ ghid: ANIMATION_TEAM_GHID }]);
    expect(await fn(sessionUser("jean.dupont"))).to.be.true;
  });

  it("should allow an admin even when in no team", async () => {
    const fn = load(["jean.dupont"], []);
    expect(await fn(sessionUser("jean.dupont"))).to.be.true;
  });

  it("should refuse the animation team of another incubator", async () => {
    // Plusieurs incubateurs ont une equipe nommee « Animation ». Seul le ghid
    // de celle de la DINUM donne le droit.
    const fn = load([], [{ ghid: "culture" }, { ghid: "inclusion gip" }]);
    expect(await fn(sessionUser("jean.dupont"))).to.be.false;
  });

  it("should refuse a member of another team", async () => {
    const fn = load([], [{ ghid: "une-autre-equipe" }, { ghid: null }]);
    expect(await fn(sessionUser("jean.dupont"))).to.be.false;
  });

  it("should refuse a member in no team at all", async () => {
    const fn = load([], []);
    expect(await fn(sessionUser("jean.dupont"))).to.be.false;
  });

  it("should refuse when there is no session user", async () => {
    const fn = load(["jean.dupont"], [{ ghid: ANIMATION_TEAM_GHID }]);
    expect(await fn(undefined)).to.be.false;
  });
});
