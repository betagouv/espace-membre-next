import { expect } from "chai";
import jwt from "jsonwebtoken";
import sinon from "sinon";

import * as nextAuth from "next-auth/next";

import config from "@/server/config";
import { DIMAIL_MAILBOX_DOMAIN } from "@/lib/dimail/utils";
import { db } from "@/lib/kysely";
import * as emailConfig from "@/server/config/email.config";
import { createData, deleteData } from "__tests__/utils/fakeData";

import { findUsersBySecondaryEmail } from "./adapter";
import {
  assertLegacyEmailLoginConfig,
  getLegacyEmailLoginConfig,
} from "./config";
import {
  canUseLegacyEmailLogin,
  EXCEPTION_EVENT,
  PROCONNECT_MFA_LOGIN_EVENT,
} from "./eligibility";
import { safeGetLegacyEmailLoginStatus } from "./actions";
import { categorizeForMigration } from "./population";
import { REMINDED_EVENT, sendLegacyEmailLoginReminders } from "./reminder";
import { checkLegacyEmailLoginAllowed } from "./signIn";

const ENV_KEYS = [
  "LEGACY_EMAIL_LOGIN_MODE",
  "LEGACY_EMAIL_LOGIN_CUTOFF_DATE",
  "LEGACY_EMAIL_LOGIN_END_DATE",
];

const setEnv = (env: Record<string, string | undefined>) => {
  for (const key of ENV_KEYS) {
    if (env[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = env[key];
    }
  }
};

const transitionEnv = {
  LEGACY_EMAIL_LOGIN_MODE: "transition",
  LEGACY_EMAIL_LOGIN_CUTOFF_DATE: "2100-01-01",
  LEGACY_EMAIL_LOGIN_END_DATE: "2100-02-01",
};

const member = {
  username: "legacy.email.login",
  primary_email: "legacy.email.login@beta.gouv.fr",
  missions: [
    {
      start: new Date("2020-01-01"),
      end: new Date("2099-01-01"),
      status: "independent",
      employer: "octo",
    },
  ],
};

describe("legacyEmailLogin", () => {
  let savedEnv: Record<string, string | undefined>;
  let user: { uuid: string; username: string; created_at: Date };

  const addEvent = (field_id: string, date: Date) =>
    db
      .insertInto("user_events")
      .values({ field_id, user_id: user.uuid, date })
      .execute();

  beforeEach(async () => {
    savedEnv = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
    await createData({ users: [member] });
    user = await db
      .selectFrom("users")
      .select(["uuid", "username", "created_at"])
      .where("username", "=", member.username)
      .executeTakeFirstOrThrow();
  });

  afterEach(async () => {
    setEnv(savedEnv);
    sinon.restore();
    await db
      .deleteFrom("user_events")
      .where("user_id", "=", user.uuid)
      .execute();
    await db
      .deleteFrom("dinum_emails")
      .where("user_id", "=", user.uuid)
      .execute();
    await deleteData({ users: [member] });
  });

  describe("config", () => {
    it("should fall back to off when the config is missing, invalid or incomplete", () => {
      for (const env of [
        {},
        { LEGACY_EMAIL_LOGIN_MODE: "on" },
        { LEGACY_EMAIL_LOGIN_MODE: "transition" },
      ]) {
        setEnv(env);
        expect(getLegacyEmailLoginConfig().mode).to.equal("off");
      }
    });

    it("should refuse to start without an explicit and complete config", () => {
      setEnv({});
      expect(() => assertLegacyEmailLoginConfig()).to.throw(
        "LEGACY_EMAIL_LOGIN_MODE",
      );
      setEnv({ LEGACY_EMAIL_LOGIN_MODE: "transition" });
      expect(() => assertLegacyEmailLoginConfig()).to.throw(
        "LEGACY_EMAIL_LOGIN_CUTOFF_DATE",
      );
      setEnv({ LEGACY_EMAIL_LOGIN_MODE: "off" });
      expect(() => assertLegacyEmailLoginConfig()).not.to.throw();
      setEnv(transitionEnv);
      expect(() => assertLegacyEmailLoginConfig()).not.to.throw();
    });
  });

  describe("canUseLegacyEmailLogin", () => {
    it("should allow an existing member who never logged in with ProConnect + MFA", async () => {
      setEnv(transitionEnv);
      expect(await canUseLegacyEmailLogin(user)).to.be.true;
    });

    it("should refuse a member created after the cutoff date", async () => {
      setEnv({
        ...transitionEnv,
        LEGACY_EMAIL_LOGIN_CUTOFF_DATE: "2000-01-01",
      });
      expect(await canUseLegacyEmailLogin(user)).to.be.false;
    });

    it("should refuse a member who already logged in with ProConnect + MFA", async () => {
      setEnv(transitionEnv);
      await addEvent(PROCONNECT_MFA_LOGIN_EVENT, new Date());
      expect(await canUseLegacyEmailLogin(user)).to.be.false;
    });

    it("should not count the former login.proconnect event (no MFA) as migrated", async () => {
      setEnv(transitionEnv);
      await addEvent("login.proconnect", new Date());
      expect(await canUseLegacyEmailLogin(user)).to.be.true;
    });

    it("should only allow members with an unexpired exception in exceptions mode", async () => {
      setEnv({ LEGACY_EMAIL_LOGIN_MODE: "exceptions" });
      expect(await canUseLegacyEmailLogin(user)).to.be.false;
      await addEvent(EXCEPTION_EVENT, new Date(Date.now() - 1000));
      expect(await canUseLegacyEmailLogin(user)).to.be.false;
      await db
        .updateTable("user_events")
        .set({ date: new Date(Date.now() + 24 * 3600 * 1000) })
        .where("user_id", "=", user.uuid)
        .where("field_id", "=", EXCEPTION_EVENT)
        .execute();
      expect(await canUseLegacyEmailLogin(user)).to.be.true;
    });

    it("should refuse everybody when off, exceptions included", async () => {
      setEnv({ LEGACY_EMAIL_LOGIN_MODE: "off" });
      await addEvent(EXCEPTION_EVENT, new Date(Date.now() + 24 * 3600 * 1000));
      expect(await canUseLegacyEmailLogin(user)).to.be.false;
    });
  });

  describe("checkLegacyEmailLoginAllowed", () => {
    it("should ignore other providers", async () => {
      setEnv({ LEGACY_EMAIL_LOGIN_MODE: "off" });
      await checkLegacyEmailLoginAllowed({
        provider: "proconnect",
        dbUser: user,
        isVerificationRequest: false,
      });
    });

    it("should throw EmailLoginClosed for a refused email login", async () => {
      setEnv({ LEGACY_EMAIL_LOGIN_MODE: "exceptions" });
      let error: Error | undefined;
      try {
        await checkLegacyEmailLoginAllowed({
          provider: "email",
          dbUser: user,
          isVerificationRequest: false,
        });
      } catch (e) {
        error = e as Error;
      }
      expect(error?.message).to.equal("EmailLoginClosed");
    });
  });

  describe("findUsersBySecondaryEmail", () => {
    beforeEach(async () => {
      await db
        .updateTable("users")
        .set({ secondary_email: "Perso.Legacy@example.com" })
        .where("uuid", "=", user.uuid)
        .execute();
    });

    it("should find a member by personal email while enabled", async () => {
      setEnv(transitionEnv);
      const users = await findUsersBySecondaryEmail("perso.legacy@EXAMPLE.com");
      expect(users.map((u) => u.username)).to.deep.equal([member.username]);
    });

    it("should find nobody when off", async () => {
      setEnv({ LEGACY_EMAIL_LOGIN_MODE: "off" });
      expect(
        await findUsersBySecondaryEmail("perso.legacy@example.com"),
      ).to.deep.equal([]);
    });
  });

  describe("sendLegacyEmailLoginReminders", () => {
    let sendEmailStub: sinon.SinonStub;
    const sentToMember = () =>
      sendEmailStub
        .getCalls()
        .filter((c) => c.args[0].toEmail.includes(member.primary_email));

    beforeEach(() => {
      sendEmailStub = sinon.stub(emailConfig, "sendEmail").resolves(null);
    });

    it("should remind a member not migrated yet, once a week", async () => {
      setEnv(transitionEnv);
      await sendLegacyEmailLoginReminders();
      expect(sentToMember()).to.have.length(1);
      expect(sentToMember()[0].args[0].variables.loginEmail).to.equal(
        member.primary_email,
      );
      await sendLegacyEmailLoginReminders();
      expect(sentToMember()).to.have.length(1);
      const reminded = await db
        .selectFrom("user_events")
        .select("field_id")
        .where("user_id", "=", user.uuid)
        .where("field_id", "=", REMINDED_EVENT)
        .execute();
      expect(reminded).to.have.length(1);
    });

    it("should not remind a member who migrated", async () => {
      setEnv(transitionEnv);
      await addEvent(PROCONNECT_MFA_LOGIN_EVENT, new Date());
      await sendLegacyEmailLoginReminders();
      expect(sentToMember()).to.have.length(0);
    });

    it("should write to both addresses and never give a personal one to ProConnect", async () => {
      setEnv(transitionEnv);
      await db
        .updateTable("users")
        .set({
          primary_email: "Perso.Legacy@gmail.com",
          secondary_email: "autre.perso@example.com",
        })
        .where("uuid", "=", user.uuid)
        .execute();
      await sendLegacyEmailLoginReminders();
      const calls = sendEmailStub
        .getCalls()
        .filter((c) => c.args[0].toEmail.includes("perso.legacy@gmail.com"));
      expect(calls).to.have.length(1);
      expect(calls[0].args[0].toEmail).to.deep.equal([
        "perso.legacy@gmail.com",
        "autre.perso@example.com",
      ]);
      expect(calls[0].args[0].variables.loginEmail).to.be.null;
    });

    describe("legacy @ext.beta.gouv.fr members", () => {
      const extEmail = "legacy.email.login@ext.beta.gouv.fr";
      const sentToExt = () =>
        sendEmailStub
          .getCalls()
          .filter((c) => c.args[0].toEmail.includes(extEmail));

      beforeEach(async () => {
        await db
          .updateTable("users")
          .set({ primary_email: extEmail })
          .where("uuid", "=", user.uuid)
          .execute();
      });

      it("should give their main domain alias as the ProConnect address", async () => {
        setEnv(transitionEnv);
        const alias = `legacy.email.login@${DIMAIL_MAILBOX_DOMAIN}`;
        await db
          .insertInto("dinum_emails")
          .values([
            { email: extEmail, user_id: user.uuid, type: "mailbox" },
            { email: alias, user_id: user.uuid, type: "alias" },
          ])
          .execute();
        await sendLegacyEmailLoginReminders();
        expect(sentToExt()).to.have.length(1);
        expect(sentToExt()[0].args[0].variables.loginEmail).to.equal(alias);
      });

      it("should skip them without alias, until the ext migration", async () => {
        setEnv(transitionEnv);
        await sendLegacyEmailLoginReminders();
        expect(sentToExt()).to.have.length(0);
      });
    });

    it("should send nothing outside the transition", async () => {
      setEnv({ LEGACY_EMAIL_LOGIN_MODE: "exceptions" });
      await sendLegacyEmailLoginReminders();
      expect(sendEmailStub.called).to.be.false;
    });
  });

  describe("categorizeForMigration", () => {
    const alias = `prenom.nom@${DIMAIL_MAILBOX_DOMAIN}`;

    it("should check ext addresses before the public service ones", async () => {
      expect(
        await categorizeForMigration({
          primary_email: "prenom.nom@ext.beta.gouv.fr",
          dinumEmails: [],
        }),
      ).to.equal("ext_without_alias");
      expect(
        await categorizeForMigration({
          primary_email: "prenom.nom@ext.beta.gouv.fr",
          dinumEmails: ["prenom.nom@ext.beta.gouv.fr", alias],
        }),
      ).to.equal("ext_with_beta_alias");
    });

    it("should recognize addresses ProConnect accepts", async () => {
      expect(
        await categorizeForMigration({ primary_email: alias, dinumEmails: [] }),
      ).to.equal("beta");
      expect(
        await categorizeForMigration({
          primary_email: "prenom.nom@ademe.gouv.fr",
          dinumEmails: [],
        }),
      ).to.equal("public_service");
    });

    it("should flag members without a usable address", async () => {
      expect(
        await categorizeForMigration({ primary_email: null, dinumEmails: [] }),
      ).to.equal("no_primary_email");
      expect(
        await categorizeForMigration({
          primary_email: "prenom.nom@gmail.com",
          dinumEmails: [],
        }),
      ).to.equal("other");
    });
  });
});

describe("legacy email login admin actions", () => {
  const admin = "admin.legacy.email";

  beforeEach(() => {
    sinon.stub(config, "ESPACE_MEMBRE_ADMIN").value([admin]);
  });

  afterEach(() => sinon.restore());

  const asSession = (provider: string, acr?: string) =>
    sinon.stub(nextAuth, "getServerSession").resolves({
      user: {
        id: admin,
        provider,
        id_token: acr ? jwt.sign({ acr }, "test") : undefined,
      },
    } as any);

  it("should refuse an admin who logged in with a magic link", async () => {
    asSession("email");
    const res = await safeGetLegacyEmailLoginStatus("someone");
    expect(res.success).to.be.false;
    expect(res.message).to.include("ProConnect");
  });

  it("should refuse a ProConnect session opened without MFA", async () => {
    // sessions opened before MFA was required (acr eidas1)
    asSession("proconnect", "eidas1");
    const res = await safeGetLegacyEmailLoginStatus("someone");
    expect(res.success).to.be.false;
    expect(res.message).to.include("ProConnect");
  });

  it("should let an admin logged in with ProConnect + MFA through", async () => {
    asSession("proconnect", "eidas1-mfa");
    const res = await safeGetLegacyEmailLoginStatus("someone");
    // past the session check : the member does not exist
    expect(res.success).to.be.false;
    expect(res.message).to.equal("Membre introuvable");
  });
});
