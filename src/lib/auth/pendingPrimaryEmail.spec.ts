import { expect } from "chai";
import jwt from "jsonwebtoken";
import proxyquire from "proxyquire";
import sinon from "sinon";

import { EXCEPTION_EVENT } from "@/lib/auth/legacyEmailLogin/eligibility";
import { findUsersUsingEmail } from "@/lib/auth/findUsersByLoginEmail";
import {
  findUsersByPendingPrimaryEmail,
  promotePendingPrimaryEmail,
} from "@/lib/auth/pendingPrimaryEmail";
import { authOptions } from "@/lib/authoptions";
import { DIMAIL_MAILBOX_DOMAIN } from "@/lib/dimail/utils";
import { db } from "@/lib/kysely";
import customPostgresAdapter from "@/lib/pgAdpter";
import config from "@/server/config";
import { createData, deleteData } from "__tests__/utils/fakeData";

const mission = {
  start: new Date("2020-01-01"),
  end: new Date("2099-01-01"),
  status: "independent",
  employer: "octo",
};
const member = {
  username: "pending.member",
  primary_email: "pending.member@numerique.gouv.fr",
  missions: [mission],
};
const other = {
  username: "pending.other",
  primary_email: "pending.other@numerique.gouv.fr",
  missions: [mission],
};
const admin = "pending.admin";
const newEmail = "pending.member@culture.gouv.fr";

const getUser = (username: string) =>
  db
    .selectFrom("users")
    .selectAll()
    .where("username", "=", username)
    .executeTakeFirstOrThrow();

const getServerSessionStub = sinon.stub();
const {
  safeChoosePrimaryEmailFromDimail,
  safeGetPrimaryEmailSettings,
  safeRequestPrimaryEmailChange,
  safeRequestPrimaryEmailSwap,
} = proxyquire("@/app/api/member/actions/primaryEmail", {
  "next-auth/next": { getServerSession: getServerSessionStub },
  "next/cache": { revalidatePath: () => {} },
});

const asSession = (id: string, provider: string, acr?: string) =>
  getServerSessionStub.resolves({
    user: {
      id,
      provider,
      id_token: acr ? jwt.sign({ acr }, "test") : undefined,
    },
  } as any);

const setPending = (username: string, email: string, expiresInMs: number) =>
  db
    .updateTable("users")
    .set({
      pending_primary_email: email,
      pending_primary_email_expires_at: new Date(Date.now() + expiresInMs),
      pending_primary_email_requested_by: username,
    })
    .where("username", "=", username)
    .execute();

describe("primary email verified by ProConnect", () => {
  let memberUuid: string;

  beforeEach(async () => {
    await createData({ users: [member, other] });
    memberUuid = (await getUser(member.username)).uuid;
    sinon.stub(config, "ESPACE_MEMBRE_ADMIN").value([admin]);
  });

  afterEach(async () => {
    sinon.restore();
    await db
      .deleteFrom("dinum_emails")
      .where("user_id", "=", memberUuid)
      .execute();
    await db
      .deleteFrom("user_events")
      .where("user_id", "=", memberUuid)
      .execute();
    await db
      .deleteFrom("events")
      .where("action_on_username", "=", member.username)
      .execute();
    await deleteData({ users: [member, other] });
  });

  describe("requestPrimaryEmailChange", () => {
    it("should store the address as pending for 7 days, from an MFA session", async () => {
      asSession(member.username, "proconnect", "eidas1-mfa");
      const res = await safeRequestPrimaryEmailChange(
        member.username,
        newEmail,
      );
      expect(res.success, res.message).to.be.true;
      const user = await getUser(member.username);
      expect(user.primary_email).to.equal(member.primary_email);
      expect(user.pending_primary_email).to.equal(newEmail);
      const days =
        (user.pending_primary_email_expires_at!.getTime() - Date.now()) /
        (24 * 3600 * 1000);
      expect(days).to.be.within(6.9, 7);
    });

    it("should refuse a magic link session, unless opened through a support exception", async () => {
      asSession(member.username, "email");
      let res = await safeRequestPrimaryEmailChange(member.username, newEmail);
      expect(res.success).to.be.false;
      expect(res.message).to.include("ProConnect");

      await db
        .insertInto("user_events")
        .values({
          field_id: EXCEPTION_EVENT,
          user_id: memberUuid,
          date: new Date(Date.now() + 24 * 3600 * 1000),
        })
        .execute();
      res = await safeRequestPrimaryEmailChange(member.username, newEmail);
      expect(res.success, res.message).to.be.true;
    });

    it("should let an admin with MFA propose an address for someone else", async () => {
      asSession(admin, "proconnect", "eidas1-mfa");
      const res = await safeRequestPrimaryEmailChange(
        member.username,
        newEmail,
      );
      expect(res.success, res.message).to.be.true;
      expect(
        (await getUser(member.username)).pending_primary_email_requested_by,
      ).to.equal(admin);
    });

    it("should refuse another member", async () => {
      asSession(other.username, "proconnect", "eidas1-mfa");
      const res = await safeRequestPrimaryEmailChange(
        member.username,
        newEmail,
      );
      expect(res.success).to.be.false;
      expect((await getUser(member.username)).pending_primary_email).to.be.null;
    });

    it("should refuse an @ext address and an address used by another member", async () => {
      asSession(member.username, "proconnect", "eidas1-mfa");
      let res = await safeRequestPrimaryEmailChange(
        member.username,
        "pending.member@ext.beta.gouv.fr",
      );
      expect(res.success).to.be.false;
      expect(res.message).to.include("ext.beta.gouv.fr");
      res = await safeRequestPrimaryEmailChange(
        member.username,
        other.primary_email,
      );
      expect(res.success).to.be.false;
      expect(res.message).to.include("déjà utilisé");
    });

    it("should refuse a request for a member not onboarded yet", async () => {
      await db
        .updateTable("users")
        .set({ primary_email: null })
        .where("uuid", "=", memberUuid)
        .execute();
      asSession(admin, "proconnect", "eidas1-mfa");
      const res = await safeRequestPrimaryEmailChange(
        member.username,
        newEmail,
      );
      expect(res.success).to.be.false;
      expect(res.message).to.include("arrivée");
    });
  });

  describe("requestPrimaryEmailSwap", () => {
    beforeEach(() =>
      db
        .updateTable("users")
        .set({ secondary_email: newEmail })
        .where("uuid", "=", memberUuid)
        .execute(),
    );

    it("should let only an admin with MFA put the personal email in pending", async () => {
      asSession(member.username, "proconnect", "eidas1-mfa");
      let settings = await safeGetPrimaryEmailSettings(member.username);
      expect(settings.data.canSwap).to.be.false;
      expect((await safeRequestPrimaryEmailSwap(member.username)).success).to.be
        .false;

      asSession(admin, "proconnect", "eidas1-mfa");
      settings = await safeGetPrimaryEmailSettings(member.username);
      expect(settings.data.canSwap).to.be.true;
      const res = await safeRequestPrimaryEmailSwap(member.username);
      expect(res.success, res.message).to.be.true;
      const user = await getUser(member.username);
      expect(user.primary_email).to.equal(member.primary_email);
      expect(user.pending_primary_email).to.equal(newEmail);
      expect(user.pending_primary_email_requested_by).to.equal(admin);
    });

    it("should swap both addresses at the ProConnect + MFA login with the personal email", async () => {
      await setPending(member.username, newEmail, 3600 * 1000);
      await authOptions.events!.signIn!({
        user: { id: member.username } as any,
        account: { provider: "proconnect" } as any,
        profile: { email: newEmail } as any,
      });
      const user = await getUser(member.username);
      expect(user.primary_email).to.equal(newEmail);
      expect(user.secondary_email).to.equal(member.primary_email);
      expect(user.pending_primary_email).to.be.null;
    });
  });

  describe("member whose mission is over", () => {
    const alias = `pending.member@${DIMAIL_MAILBOX_DOMAIN}`;

    beforeEach(async () => {
      await db
        .updateTable("missions")
        .set({ end: new Date("2020-06-01") })
        .where("user_id", "=", memberUuid)
        .execute();
      await db
        .insertInto("dinum_emails")
        .values({ email: alias, user_id: memberUuid, type: "alias" })
        .execute();
    });

    it("should refuse their own requests, not an admin's", async () => {
      asSession(member.username, "proconnect", "eidas1-mfa");
      const settings = await safeGetPrimaryEmailSettings(member.username);
      expect(settings.data.expired).to.be.true;
      expect(settings.data.canRequest).to.be.false;
      expect(settings.data.canChooseDimail).to.be.false;
      let res = await safeRequestPrimaryEmailChange(member.username, newEmail);
      expect(res.success).to.be.false;
      expect(res.message).to.include("mission est terminée");
      res = await safeChoosePrimaryEmailFromDimail(member.username, alias);
      expect(res.success).to.be.false;
      expect(res.message).to.include("mission est terminée");
      const user = await getUser(member.username);
      expect(user.primary_email).to.equal(member.primary_email);
      expect(user.pending_primary_email).to.be.null;

      asSession(admin, "proconnect", "eidas1-mfa");
      res = await safeRequestPrimaryEmailChange(member.username, newEmail);
      expect(res.success, res.message).to.be.true;
    });
  });

  describe("choosePrimaryEmailFromDimail", () => {
    const alias = `pending.member@${DIMAIL_MAILBOX_DOMAIN}`;

    beforeEach(async () => {
      await db
        .insertInto("dinum_emails")
        .values({ email: alias, user_id: memberUuid, type: "alias" })
        .execute();
    });

    it("should neither offer nor accept a disabled or deleted address", async () => {
      const disabled = `pending.old@${DIMAIL_MAILBOX_DOMAIN}`;
      const deleted = `pending.gone@${DIMAIL_MAILBOX_DOMAIN}`;
      await db
        .insertInto("dinum_emails")
        .values([
          {
            email: disabled,
            user_id: memberUuid,
            type: "mailbox",
            status: "disabled",
          },
          {
            email: deleted,
            user_id: memberUuid,
            type: "alias",
            status: "deleted",
          },
        ])
        .execute();
      asSession(member.username, "proconnect", "eidas1-mfa");
      const res = await safeGetPrimaryEmailSettings(member.username);
      expect(res.success, res.message).to.be.true;
      expect(res.data.dimailAddresses).to.deep.equal([alias]);
      for (const email of [disabled, deleted]) {
        const choice = await safeChoosePrimaryEmailFromDimail(
          member.username,
          email,
        );
        expect(choice.success).to.be.false;
      }
      expect((await getUser(member.username)).primary_email).to.equal(
        member.primary_email,
      );
    });

    it("should set one of the member's Dimail addresses directly", async () => {
      asSession(member.username, "proconnect", "eidas1-mfa");
      const res = await safeChoosePrimaryEmailFromDimail(
        member.username,
        alias,
      );
      expect(res.success, res.message).to.be.true;
      expect((await getUser(member.username)).primary_email).to.equal(alias);
    });

    it("should refuse an address that is not theirs, or a magic link session", async () => {
      asSession(member.username, "proconnect", "eidas1-mfa");
      let res = await safeChoosePrimaryEmailFromDimail(
        member.username,
        `someone.else@${DIMAIL_MAILBOX_DOMAIN}`,
      );
      expect(res.success).to.be.false;
      asSession(member.username, "email");
      res = await safeChoosePrimaryEmailFromDimail(member.username, alias);
      expect(res.success).to.be.false;
      expect((await getUser(member.username)).primary_email).to.equal(
        member.primary_email,
      );
    });
  });

  describe("login with a pending address", () => {
    it("should find the member by an unexpired pending address only", async () => {
      await setPending(member.username, newEmail, 3600 * 1000);
      const adapterUser =
        await customPostgresAdapter().getUserByEmail!(newEmail);
      expect(adapterUser?.id).to.equal(member.username);
      expect(
        (await findUsersUsingEmail(newEmail)).map((u) => u.username),
      ).to.deep.equal([member.username]);

      await setPending(member.username, newEmail, -1000);
      expect(await findUsersByPendingPrimaryEmail(newEmail)).to.deep.equal([]);
    });

    it("should promote the pending address after a ProConnect + MFA login with it", async () => {
      await setPending(member.username, newEmail, 3600 * 1000);
      await authOptions.events!.signIn!({
        user: { id: member.username } as any,
        account: { provider: "proconnect" } as any,
        profile: { email: newEmail } as any,
      });
      const user = await getUser(member.username);
      expect(user.primary_email).to.equal(newEmail);
      expect(user.pending_primary_email).to.be.null;
    });

    it("should not promote on a login with another address, or once expired", async () => {
      await setPending(member.username, newEmail, 3600 * 1000);
      expect(
        await promotePendingPrimaryEmail({
          username: member.username,
          loginEmail: member.primary_email,
        }),
      ).to.be.false;
      await setPending(member.username, newEmail, -1000);
      expect(
        await promotePendingPrimaryEmail({
          username: member.username,
          loginEmail: newEmail,
        }),
      ).to.be.false;
      expect((await getUser(member.username)).primary_email).to.equal(
        member.primary_email,
      );
    });
  });

  describe("magic link", () => {
    beforeEach(() => {
      sinon.stub(process, "env").value({
        ...process.env,
        LEGACY_EMAIL_LOGIN_MODE: "transition",
        LEGACY_EMAIL_LOGIN_CUTOFF_DATE: "2100-01-01",
      });
    });

    const requestLink = (typedEmail: string) =>
      authOptions.callbacks!.signIn!({
        user: { id: member.username } as any,
        account: {
          provider: "email",
          type: "email",
          providerAccountId: typedEmail,
        } as any,
        email: { verificationRequest: true },
      });

    it("should never send a link to a pending address", async () => {
      await setPending(member.username, newEmail, 3600 * 1000);
      let error: Error | undefined;
      try {
        await requestLink(newEmail);
      } catch (e) {
        error = e as Error;
      }
      expect(error?.message).to.equal("UnknownMember");
    });

    it("should still send it to the member's own login address", async () => {
      expect(await requestLink(member.primary_email)).to.be.true;
    });
  });
});
