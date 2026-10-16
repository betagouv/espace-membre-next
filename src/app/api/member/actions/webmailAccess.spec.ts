import { expect } from "chai";
import jwt from "jsonwebtoken";
import proxyquire from "proxyquire";
import sinon from "sinon";

import { db } from "@/lib/kysely";
import config from "@/server/config";
import { createData, deleteData } from "__tests__/utils/fakeData";

describe("resend webmail access", () => {
  const admin = "webmail.admin";
  const member = {
    username: "webmail.member",
    secondary_email: "webmail.member@example.com",
    missions: [
      {
        start: new Date("2020-01-01"),
        end: new Date("2099-01-01"),
        status: "independent",
        employer: "octo",
      },
    ],
  };
  const mailbox = "webmail.member@ext.beta.gouv.fr";
  const getServerSessionStub = sinon.stub();
  const sendWebmailAccessCodeStub = sinon.stub();
  const actions = proxyquire("./webmailAccess", {
    "next-auth/next": { getServerSession: getServerSessionStub },
    "@/server/queueing/workers/create-dimail-mailbox": {
      sendWebmailAccessCode: sendWebmailAccessCodeStub,
    },
  });
  let uuid: string;

  const asUser = (id: string, acr?: string) =>
    getServerSessionStub.resolves({
      user: {
        id,
        provider: "proconnect",
        id_token: acr ? jwt.sign({ acr }, "test") : undefined,
      },
    } as any);
  const addMailbox = (email = mailbox, status = "enabled") =>
    db
      .insertInto("dinum_emails")
      .values({ email, type: "mailbox", status, user_id: uuid })
      .execute();
  const resend = (expected = member.secondary_email) =>
    actions.safeResendWebmailAccess(member.username, expected);

  beforeEach(async () => {
    sinon.stub(config, "ESPACE_MEMBRE_ADMIN").value([admin]);
    sendWebmailAccessCodeStub.reset();
    sendWebmailAccessCodeStub.resolves();
    asUser(admin, "eidas1-mfa");
    await createData({ users: [member] });
    uuid = (
      await db
        .selectFrom("users")
        .select("uuid")
        .where("username", "=", member.username)
        .executeTakeFirstOrThrow()
    ).uuid;
  });

  afterEach(async () => {
    sinon.restore();
    await db.deleteFrom("dinum_emails").where("user_id", "=", uuid).execute();
    await db
      .deleteFrom("events")
      .where("action_on_username", "=", member.username)
      .execute();
    await deleteData({ users: [member] });
  });

  it("should send a new access link to the personal email, traced", async () => {
    await addMailbox();
    const res = await resend();
    expect(res.success, res.message).to.be.true;
    expect(sendWebmailAccessCodeStub.firstCall.args[0]).to.deep.equal({
      mailboxEmail: mailbox,
      toEmail: member.secondary_email,
      resend: true,
    });
    const events = await db
      .selectFrom("events")
      .select("action_code")
      .where("action_on_username", "=", member.username)
      .execute();
    expect(events.map((e) => e.action_code)).to.deep.equal([
      "MEMBER_WEBMAIL_ACCESS_SENT",
    ]);
  });

  it("should refuse a non admin and an admin without MFA", async () => {
    await addMailbox();
    asUser(member.username, "eidas1-mfa");
    expect((await resend()).success).to.be.false;
    asUser(admin, "eidas1");
    const res = await resend();
    expect(res.success).to.be.false;
    expect(res.message).to.include("ProConnect");
    expect(sendWebmailAccessCodeStub.notCalled).to.be.true;
  });

  it("should refuse a member without personal email", async () => {
    await addMailbox();
    await db
      .updateTable("users")
      .set({ secondary_email: null })
      .where("uuid", "=", uuid)
      .execute();
    const res = await resend();
    expect(res.success).to.be.false;
    expect(res.message).to.include("email secondaire");
  });

  it("should refuse when the personal email changed since the admin confirmed it", async () => {
    await addMailbox();
    const res = await resend("ancien@example.com");
    expect(res.success).to.be.false;
    expect(res.message).to.include("a changé");
    expect(sendWebmailAccessCodeStub.notCalled).to.be.true;
  });

  it("should refuse a disabled mailbox and a namesake's mailbox", async () => {
    await addMailbox("webmail.member@beta.gouv.fr", "disabled");
    let res = await resend();
    expect(res.message).to.include("désactivée");
    await db.deleteFrom("dinum_emails").where("user_id", "=", uuid).execute();
    await addMailbox("homonyme.autre@beta.gouv.fr");
    res = await resend();
    expect(res.success).to.be.false;
    expect(res.message).to.include("reliée");
    expect(sendWebmailAccessCodeStub.notCalled).to.be.true;
  });

  it("should accept a mailbox an admin attached by hand, whatever its name", async () => {
    await db
      .insertInto("dinum_emails")
      .values({
        email: "homonyme.autre@beta.gouv.fr",
        type: "mailbox",
        status: "enabled",
        user_id: uuid,
        user_id_locked_by: "an.admin",
        user_id_locked_at: new Date(),
      })
      .execute();
    expect((await resend()).success).to.be.true;
    expect(sendWebmailAccessCodeStub.firstCall.args[0].mailboxEmail).to.equal(
      "homonyme.autre@beta.gouv.fr",
    );
  });

  it("should refuse a second link within 5 minutes, and record the destination", async () => {
    await addMailbox();
    expect((await resend()).success).to.be.true;
    const res = await resend();
    expect(res.success).to.be.false;
    expect(res.message).to.include("5 minutes");
    const event = await db
      .selectFrom("events")
      .select("action_metadata")
      .where("action_on_username", "=", member.username)
      .executeTakeFirstOrThrow();
    // action_metadata is stored as hstore
    expect(String(event.action_metadata)).to.include(
      `"sentTo"=>"${member.secondary_email}"`,
    );
  });

  it("should refuse a member without a current mission", async () => {
    await addMailbox();
    await db
      .updateTable("missions")
      .set({ end: new Date("2021-01-01") })
      .where("user_id", "=", uuid)
      .execute();
    const res = await resend();
    expect(res.success).to.be.false;
    expect(res.message).to.include("mission");
  });
});

describe("sendWebmailAccessCode", () => {
  it("should ask Dimail for a 1 hour code on the mailbox's own domain", async () => {
    const createMailboxCode = sinon.stub().resolves({ code: "abc" });
    const sendEmail = sinon.stub().resolves();
    const { sendWebmailAccessCode } = proxyquire(
      "@/server/queueing/workers/create-dimail-mailbox",
      {
        "@/lib/dimail/client": { createMailboxCode },
        "@/server/config/email.config": { sendEmail },
      },
    );
    await sendWebmailAccessCode({
      mailboxEmail: "prenom.nom@ext.beta.gouv.fr",
      toEmail: "perso@example.com",
      resend: true,
    });
    expect(createMailboxCode.firstCall.args[0]).to.deep.equal({
      domain_name: "ext.beta.gouv.fr",
      user_name: "prenom.nom",
      maxuse: 3,
      expires_in: 3600,
    });
    expect(sendEmail.firstCall.args[0]).to.deep.include({
      toEmail: ["perso@example.com"],
    });
    expect(sendEmail.firstCall.args[0].variables).to.deep.include({
      email: "prenom.nom@ext.beta.gouv.fr",
      resend: true,
    });
    expect(sendEmail.firstCall.args[0].variables.webmailUrl).to.match(
      /\/code\/abc$/,
    );
  });
});
