import { expect } from "chai";
import jwt from "jsonwebtoken";

import { authOptions } from "@/lib/authoptions";
import { assertSecondaryEmailChangeAllowed } from "@/lib/auth/secondaryEmailGuard";
import { getRefusalFromLogoutState } from "@/lib/auth/proConnectLogout";
import { isMfaSession } from "@/lib/auth/sessionMfa";
import { switchLegacyExtPrimaryEmail } from "@/lib/auth/switchLegacyExtPrimaryEmail";
import { db } from "@/lib/kysely";
import customPostgresAdapter from "@/lib/pgAdpter";
import {
  getJwtTokenForUser,
  isSessionLoginExpired,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/session";
import { createData, deleteData } from "__tests__/utils/fakeData";

const sessionWith = (provider: string, acr?: string) =>
  ({
    user: {
      id: "someone",
      provider,
      id_token: acr ? jwt.sign({ acr }, "test") : undefined,
    },
  }) as any;

const rejection = async (promise: Promise<unknown>) => {
  try {
    await promise;
  } catch (e) {
    return (e as Error).message;
  }
  return null;
};

describe("isMfaSession", () => {
  it("should only accept ProConnect sessions with an MFA acr", () => {
    expect(isMfaSession(sessionWith("proconnect", "eidas1-mfa"))).to.be.true;
    expect(isMfaSession(sessionWith("proconnect", "eidas1"))).to.be.false;
    expect(isMfaSession(sessionWith("proconnect"))).to.be.false;
    expect(isMfaSession(sessionWith("email"))).to.be.false;
    expect(isMfaSession(null)).to.be.false;
  });
});

describe("session duration", () => {
  it("should sign session tokens for 24 hours", () => {
    const token = getJwtTokenForUser({ sub: "someone", uuid: "x" });
    const payload = jwt.decode(token) as jwt.JwtPayload;
    expect(payload.exp! - payload.iat!).to.equal(SESSION_MAX_AGE_SECONDS);
    expect(SESSION_MAX_AGE_SECONDS).to.equal(24 * 3600);
  });

  it("should not extend the session when the token is re-encoded", () => {
    const loginAt = Math.floor(Date.now() / 1000) - 23 * 3600;
    const token = getJwtTokenForUser({ sub: "someone", uuid: "x", loginAt });
    const payload = jwt.decode(token) as jwt.JwtPayload;
    expect(payload.loginAt).to.equal(loginAt);
    expect(payload.exp).to.equal(loginAt + SESSION_MAX_AGE_SECONDS);
  });

  it("should treat sessions older than 24 hours, or without login time, as expired", () => {
    const now = Math.floor(Date.now() / 1000);
    expect(isSessionLoginExpired(now - 25 * 3600)).to.be.true;
    expect(isSessionLoginExpired(undefined)).to.be.true;
    expect(isSessionLoginExpired(now - 3600)).to.be.false;
  });
});

describe("account security with members in database", () => {
  const owner = {
    username: "security.owner",
    primary_email: "security.owner@ext.beta.gouv.fr",
    missions: [
      {
        start: new Date("2020-01-01"),
        end: new Date("2099-01-01"),
        status: "independent",
        employer: "octo",
      },
    ],
  };
  const other = {
    username: "security.other",
    primary_email: "security.other@beta.gouv.fr",
    missions: [],
  };
  const alias = "security.owner@beta.gouv.fr";
  let ownerUuid: string;
  let otherUuid: string;

  const getUuid = async (username: string) =>
    (
      await db
        .selectFrom("users")
        .select("uuid")
        .where("username", "=", username)
        .executeTakeFirstOrThrow()
    ).uuid;
  const getPrimary = async () =>
    (
      await db
        .selectFrom("users")
        .select("primary_email")
        .where("uuid", "=", ownerUuid)
        .executeTakeFirstOrThrow()
    ).primary_email;

  beforeEach(async () => {
    await createData({ users: [owner, other] });
    ownerUuid = await getUuid(owner.username);
    otherUuid = await getUuid(other.username);
    await db
      .insertInto("dinum_emails")
      .values([
        { email: owner.primary_email, user_id: ownerUuid, type: "mailbox" },
        { email: alias, user_id: ownerUuid, type: "alias" },
      ])
      .execute();
  });

  afterEach(async () => {
    await db
      .deleteFrom("accounts")
      .where("userId", "in", [owner.username, other.username])
      .execute();
    await db
      .deleteFrom("dinum_emails")
      .where("user_id", "in", [ownerUuid, otherUuid])
      .execute();
    await db
      .deleteFrom("events")
      .where("action_on_username", "=", owner.username)
      .execute();
    await deleteData({ users: [owner, other] });
  });

  it("should ignore a ProConnect account linked to another member", async () => {
    await db
      .insertInto("accounts")
      .values([
        {
          provider: "proconnect",
          type: "oauth",
          providerAccountId: other.username,
          userId: owner.username,
        },
        {
          provider: "proconnect",
          type: "oauth",
          providerAccountId: owner.username,
          userId: owner.username,
        },
      ])
      .execute();
    const { getUserByAccount } = customPostgresAdapter();
    expect(
      await getUserByAccount!({
        provider: "proconnect",
        providerAccountId: other.username,
      }),
    ).to.be.null;
    expect(
      (
        await getUserByAccount!({
          provider: "proconnect",
          providerAccountId: owner.username,
        })
      )?.id,
    ).to.equal(owner.username);
  });

  describe("assertSecondaryEmailChangeAllowed", () => {
    const check = (session: any, newEmail: string | null) =>
      assertSecondaryEmailChangeAllowed({
        session,
        userUuid: ownerUuid,
        currentEmail: "Perso@example.com",
        newEmail,
      });

    it("should let the same value through, whatever the session", async () => {
      expect(await rejection(check(sessionWith("email"), "perso@example.com")))
        .to.be.null;
    });

    it("should refuse a change from a session without MFA", async () => {
      expect(
        await rejection(check(sessionWith("email"), "nouveau@example.com")),
      ).to.include("ProConnect");
      expect(
        await rejection(check(sessionWith("proconnect", "eidas1"), null)),
      ).to.include("ProConnect");
    });

    it("should refuse an email already used by another member", async () => {
      expect(
        await rejection(
          check(sessionWith("proconnect", "eidas1-mfa"), other.primary_email),
        ),
      ).to.include("déjà utilisé");
    });

    it("should accept a new unique email from an MFA session", async () => {
      expect(
        await rejection(
          check(sessionWith("proconnect", "eidas1-mfa"), "nouveau@example.com"),
        ),
      ).to.be.null;
    });
  });

  describe("switchLegacyExtPrimaryEmail", () => {
    it("should switch an @ext primary email to the alias used with ProConnect", async () => {
      expect(
        await switchLegacyExtPrimaryEmail({
          username: owner.username,
          loginEmail: "Security.Owner@beta.gouv.fr",
        }),
      ).to.be.true;
      expect(await getPrimary()).to.equal(alias);
      const events = await db
        .selectFrom("events")
        .select("action_code")
        .where("action_on_username", "=", owner.username)
        .execute();
      expect(events.map((e) => e.action_code)).to.deep.equal([
        "MEMBER_PRIMARY_EMAIL_UPDATED",
      ]);
    });

    it("should not use an address that is not attached to the member", async () => {
      expect(
        await switchLegacyExtPrimaryEmail({
          username: owner.username,
          loginEmail: "someone.else@beta.gouv.fr",
        }),
      ).to.be.false;
      expect(await getPrimary()).to.equal(owner.primary_email);
    });

    it("should not use an address also used by another member", async () => {
      await db
        .updateTable("users")
        .set({ secondary_email: alias })
        .where("uuid", "=", otherUuid)
        .execute();
      expect(
        await switchLegacyExtPrimaryEmail({
          username: owner.username,
          loginEmail: alias,
        }),
      ).to.be.false;
      expect(await getPrimary()).to.equal(owner.primary_email);
    });

    it("should leave a primary email outside the ext domain untouched", async () => {
      await db
        .updateTable("users")
        .set({ primary_email: "security.owner@ademe.fr" })
        .where("uuid", "=", ownerUuid)
        .execute();
      expect(
        await switchLegacyExtPrimaryEmail({
          username: owner.username,
          loginEmail: alias,
        }),
      ).to.be.false;
      expect(await getPrimary()).to.equal("security.owner@ademe.fr");
    });
  });
});

describe("ProConnect login refusals", () => {
  const signIn = authOptions.callbacks!.signIn!;

  it("should forward the refusal decided in userinfo as the error code", async () => {
    for (const code of ["UnknownMember", "ExtEmailNotAllowed"]) {
      let error: Error | undefined;
      try {
        await signIn({
          user: { id: "refused-proconnect-login" } as any,
          account: { provider: "proconnect" } as any,
          profile: { loginRefusal: code } as any,
        });
      } catch (e) {
        error = e as Error;
      }
      expect(error?.message).to.equal(code);
    }
  });

  it("should close the ProConnect session on the way back to /login", async () => {
    const env = process.env;
    process.env = {
      ...env,
      NEXT_PUBLIC_APP_BASE_URL: "https://espace-membre.example.fr",
      NEXT_PUBLIC_PRO_CONNECT_BASE_URL: "https://proconnect.example.fr",
    };
    try {
      const refusals = [
        { code: "UnknownMember", profile: { loginRefusal: "UnknownMember" } },
        // acr granted without a second factor
        { code: "MfaRequired", profile: {} },
      ];
      for (const { code, profile } of refusals) {
        const url = await signIn({
          user: { id: "refused-proconnect-login" } as any,
          account: {
            provider: "proconnect",
            id_token: jwt.sign({ acr: "eidas1" }, "test"),
          } as any,
          profile: profile as any,
        });
        expect(url).to.be.a("string");
        const params = new URL(url as string).searchParams;
        expect(params.get("id_token_hint")).to.be.a("string");
        expect(getRefusalFromLogoutState(params.get("state"))).to.equal(code);
      }
    } finally {
      process.env = env;
    }
  });
});

describe("ProConnect account linking", () => {
  const linkAccount = customPostgresAdapter().linkAccount!;

  it("should refuse to link a ProConnect identity to another member", async () => {
    let error: Error | undefined;
    try {
      await linkAccount({
        provider: "proconnect",
        type: "oauth",
        providerAccountId: "membre.attaquant",
        userId: "membre.cible",
      });
    } catch (e) {
      error = e as Error;
    }
    expect(error?.message).to.equal("AccountLinkRefused");
  });
});

describe("login events", () => {
  const username = "login.event.member";
  const getLoginEvents = async (uuid: string) =>
    (
      await db
        .selectFrom("user_events")
        .select("field_id")
        .where("user_id", "=", uuid)
        .execute()
    ).map((e) => e.field_id);
  let uuid: string;

  beforeEach(async () => {
    await createData({
      users: [
        {
          username,
          primary_email: `${username}@beta.gouv.fr`,
          missions: [
            {
              start: new Date("2020-01-01"),
              end: new Date("2099-01-01"),
              status: "independent",
              employer: "octo",
            },
          ],
        },
      ],
    });
    uuid = (
      await db
        .selectFrom("users")
        .select("uuid")
        .where("username", "=", username)
        .executeTakeFirstOrThrow()
    ).uuid;
  });

  afterEach(async () => {
    await db.deleteFrom("user_events").where("user_id", "=", uuid).execute();
    await deleteData({ users: [{ username }] as any });
  });

  it("should record the ProConnect + MFA login once it succeeded", async () => {
    await authOptions.events!.signIn!({
      user: { id: username } as any,
      account: { provider: "proconnect" } as any,
    });
    expect(await getLoginEvents(uuid)).to.deep.equal(["login.proconnect_mfa"]);
  });

  it("should record nothing in the signIn callback, which can still be followed by a refusal", async () => {
    const allowed = await authOptions.callbacks!.signIn!({
      user: { id: username } as any,
      account: {
        provider: "proconnect",
        id_token: jwt.sign({ acr: "eidas1-mfa" }, "test"),
      } as any,
    });
    expect(allowed).to.be.true;
    expect(await getLoginEvents(uuid)).to.deep.equal([]);
  });
});
