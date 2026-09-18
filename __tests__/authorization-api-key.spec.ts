import { expect } from "chai";
import { addDays, subDays } from "date-fns";

import {
  canCreatePersonalKey,
  canCreateServiceKey,
  canRevokeApiKey,
  canUseReadPerimeter,
  canUseWritePerimeter,
} from "@/lib/authorization/apiKey";
import { AuthSubject } from "@/lib/authorization/subject";
import { db } from "@/lib/kysely";

import { createData, deleteData, FakeDataInterface } from "./utils/fakeData";

const now = new Date();

const testData: FakeDataInterface = {
  incubators: [
    { ghid: "ak-incub-a", title: "AK Incubateur A" },
    { ghid: "ak-incub-b", title: "AK Incubateur B" },
  ],
  startups: [
    {
      ghid: "ak-shared",
      name: "Produit co-incube",
      incubator: "ak-incub-a",
      incubators: ["ak-incub-b"],
    },
  ],
  teams: [
    { ghid: "ak-team-a", name: "Equipe A", incubator: "ak-incub-a" },
    { ghid: "ak-team-b", name: "Equipe B", incubator: "ak-incub-b" },
  ],
  users: [
    {
      username: "ak-lead-a",
      role: "Coach",
      teams: ["ak-team-a"],
      missions: [{ start: subDays(now, 30), end: addDays(now, 30) }],
    },
    {
      username: "ak-lead-b",
      role: "Coach",
      teams: ["ak-team-b"],
      missions: [{ start: subDays(now, 30), end: addDays(now, 30) }],
    },
    {
      // Expire depuis 2 jours : le seuil de checkUserIsExpired est 1.
      username: "ak-expired-lead",
      role: "Coach",
      teams: ["ak-team-a"],
      missions: [{ start: subDays(now, 90), end: subDays(now, 2) }],
    },
    { username: "ak-plain", role: "Developpeuse", missions: [] },
  ],
};

const subjectOf = async (
  username: string,
  isAdmin = false,
): Promise<AuthSubject> => {
  const user = await db
    .selectFrom("users")
    .select("uuid")
    .where("username", "=", username)
    .executeTakeFirstOrThrow();
  return { uuid: user.uuid, username, isAdmin };
};

const uuidOf = async (table: "incubators" | "startups", ghid: string) =>
  (
    await db
      .selectFrom(table)
      .select("uuid")
      .where("ghid", "=", ghid)
      .executeTakeFirstOrThrow()
  ).uuid;

describe("api key authorization", () => {
  before(async () => {
    await createData(testData);
  });

  after(async () => {
    await deleteData(testData);
  });

  it("lets any member take a global read perimeter", async () => {
    const plain = await subjectOf("ak-plain");
    expect(canUseReadPerimeter(plain, { kind: "global" })).to.be.true;
  });

  it("reserves the global write perimeter to admins", async () => {
    const plain = await subjectOf("ak-plain");
    const admin = await subjectOf("ak-plain", true);
    expect(await canUseWritePerimeter(plain, { kind: "global" })).to.be.false;
    expect(await canUseWritePerimeter(admin, { kind: "global" })).to.be.true;
  });

  it("lets a team member write on their own incubator, not on another", async () => {
    const leadA = await subjectOf("ak-lead-a");
    const incubatorA = await uuidOf("incubators", "ak-incub-a");
    const incubatorB = await uuidOf("incubators", "ak-incub-b");

    expect(await canUseWritePerimeter(leadA, { kind: "incubator", uuid: incubatorA }))
      .to.be.true;
    expect(await canUseWritePerimeter(leadA, { kind: "incubator", uuid: incubatorB }))
      .to.be.false;
  });

  // canUseWritePerimeter reutilise canEditStartup : la co-incubation est
  // gratuite.
  it("lets a member of ANY linked incubator write on a co-incubated product", async () => {
    const leadB = await subjectOf("ak-lead-b");
    const startup = await uuidOf("startups", "ak-shared");
    expect(await canUseWritePerimeter(leadB, { kind: "startup", uuid: startup }))
      .to.be.true;
  });

  it("refuses a service key to a plain member and grants it to a living lead", async () => {
    const incubatorA = await uuidOf("incubators", "ak-incub-a");
    expect(await canCreateServiceKey(await subjectOf("ak-plain"), incubatorA)).to
      .be.false;
    expect(await canCreateServiceKey(await subjectOf("ak-lead-a"), incubatorA)).to
      .be.true;
  });

  it("refuses a service key to a lead expired for two days", async () => {
    const incubatorA = await uuidOf("incubators", "ak-incub-a");
    expect(
      await canCreateServiceKey(await subjectOf("ak-expired-lead"), incubatorA),
    ).to.be.false;
  });

  // Clef d'organisation (owner_incubator_id NULL) : admins seuls.
  it("refuses an organisation service key to a lead", async () => {
    expect(await canCreateServiceKey(await subjectOf("ak-lead-a"), null)).to.be
      .false;
    expect(await canCreateServiceKey(await subjectOf("ak-lead-a", true), null)).to
      .be.true;
  });

  it("lets a member create a personal key for themselves only", async () => {
    const plain = await subjectOf("ak-plain");
    const other = await subjectOf("ak-lead-a");
    expect(canCreatePersonalKey(plain, plain.uuid)).to.be.true;
    expect(canCreatePersonalKey(plain, other.uuid)).to.be.false;
    expect(canCreatePersonalKey({ ...plain, isAdmin: true }, other.uuid)).to.be
      .true;
  });

  /**
   * Elargissement delibere et borne : le porteur revoque sa propre clef
   * personnelle, sans quoi il pourrait en creer une sans jamais la retirer.
   */
  it("lets the holder revoke their own personal key, and nobody else's", async () => {
    const plain = await subjectOf("ak-plain");
    const other = await subjectOf("ak-lead-a");
    const mine = {
      kind: "personal" as const,
      owner_user_id: plain.uuid,
      owner_incubator_id: null,
    };
    expect(await canRevokeApiKey(plain, mine)).to.be.true;
    expect(await canRevokeApiKey(other, mine)).to.be.false;
    expect(await canRevokeApiKey({ ...other, isAdmin: true }, mine)).to.be.true;
  });

  it("lets a lead revoke a service key of their incubator", async () => {
    const incubatorA = await uuidOf("incubators", "ak-incub-a");
    const serviceKey = {
      kind: "service" as const,
      owner_user_id: null,
      owner_incubator_id: incubatorA,
    };
    expect(await canRevokeApiKey(await subjectOf("ak-lead-a"), serviceKey)).to.be
      .true;
    expect(await canRevokeApiKey(await subjectOf("ak-lead-b"), serviceKey)).to.be
      .false;
  });

  it("reserves an organisation service key revocation to admins", async () => {
    const orgKey = {
      kind: "service" as const,
      owner_user_id: null,
      owner_incubator_id: null,
    };
    expect(await canRevokeApiKey(await subjectOf("ak-lead-a"), orgKey)).to.be
      .false;
    expect(await canRevokeApiKey(await subjectOf("ak-lead-a", true), orgKey)).to
      .be.true;
  });
});
