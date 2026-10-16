import { expect } from "chai";
import jwt from "jsonwebtoken";
import proxyquire from "proxyquire";
import sinon from "sinon";

import { db } from "@/lib/kysely";
import config from "@/server/config";
import { createData, deleteData } from "__tests__/utils/fakeData";

describe("dinum_emails manual attachment", () => {
  const admin = "attach.admin";
  const member = { username: "attach.member", missions: [] };
  const other = { username: "attach.other", missions: [] };
  const email = "attach.member@attach-test.beta.gouv.fr";
  const getServerSessionStub = sinon.stub();
  const actions = proxyquire("./dinumEmails", {
    "next-auth/next": { getServerSession: getServerSessionStub },
    "next/cache": { revalidatePath: () => {} },
  });
  let memberUuid: string;
  let otherUuid: string;

  const getUuid = async (username: string) =>
    (
      await db
        .selectFrom("users")
        .select("uuid")
        .where("username", "=", username)
        .executeTakeFirstOrThrow()
    ).uuid;
  const getRow = () =>
    db
      .selectFrom("dinum_emails")
      .selectAll()
      .where("email", "=", email)
      .executeTakeFirstOrThrow();
  const asUser = (id: string, acr = "eidas1-mfa") =>
    getServerSessionStub.resolves({
      user: { id, provider: "proconnect", id_token: jwt.sign({ acr }, "test") },
    } as any);

  beforeEach(async () => {
    sinon.stub(config, "ESPACE_MEMBRE_ADMIN").value([admin]);
    await createData({ users: [member, other] });
    memberUuid = await getUuid(member.username);
    otherUuid = await getUuid(other.username);
    await db
      .insertInto("dinum_emails")
      .values({ email, type: "mailbox", status: "enabled", user_id: otherUuid })
      .execute();
  });

  afterEach(async () => {
    sinon.restore();
    await db.deleteFrom("dinum_emails").where("email", "=", email).execute();
    await db
      .deleteFrom("events")
      .where("action_on_username", "in", [member.username, other.username])
      .execute();
    await deleteData({ users: [member, other] });
  });

  const getEvents = () =>
    db
      .selectFrom("events")
      .select("action_on_username")
      .where("action_code", "=", "MEMBER_DINUM_EMAIL_ATTACHMENT_UPDATED")
      .where("action_on_username", "in", [member.username, other.username])
      .execute();

  it("should ask for a confirmation before moving an address attached to another member", async () => {
    asUser(admin);
    const res = await actions.safeAttachDinumEmailToMember(
      member.username,
      email,
    );
    expect(res.success, res.message).to.be.true;
    expect(res.data).to.deep.equal({
      attached: false,
      currentOwner: other.username,
    });
    expect((await getRow()).user_id).to.equal(otherUuid);
  });

  it("should let an admin attach an address to a member and lock it, traced on both fiches", async () => {
    asUser(admin);
    const res = await actions.safeAttachDinumEmailToMember(
      member.username,
      email.toUpperCase(),
      { confirmMove: true },
    );
    expect(res.success, res.message).to.be.true;
    expect(await getRow()).to.include({
      user_id: memberUuid,
      user_id_locked_by: admin,
    });
    expect(
      (await getEvents()).map((e) => e.action_on_username).sort(),
    ).to.deep.equal([member.username, other.username].sort());
    const list = await actions.safeGetMemberDinumEmails(member.username);
    expect(list.data.map((r) => r.email)).to.deep.equal([email]);
  });

  it("should refuse an address that is the primary or secondary email of another member", async () => {
    asUser(admin);
    for (const column of ["primary_email", "secondary_email"] as const) {
      await db
        .updateTable("users")
        .set({ [column]: email.toUpperCase() })
        .where("uuid", "=", otherUuid)
        .execute();
      const res = await actions.safeAttachDinumEmailToMember(
        member.username,
        email,
        { confirmMove: true },
      );
      expect(res.success).to.be.false;
      expect(res.message).to.include(other.username);
      expect((await getRow()).user_id).to.equal(otherUuid);
      await db
        .updateTable("users")
        .set({ [column]: null })
        .where("uuid", "=", otherUuid)
        .execute();
    }
  });

  it("should refuse an address pending as another member's primary email", async () => {
    asUser(admin);
    await db
      .updateTable("users")
      .set({
        pending_primary_email: email,
        pending_primary_email_expires_at: new Date(Date.now() + 3600 * 1000),
      })
      .where("uuid", "=", otherUuid)
      .execute();
    const res = await actions.safeAttachDinumEmailToMember(
      member.username,
      email,
      { confirmMove: true },
    );
    expect(res.success).to.be.false;
    expect(res.message).to.include("en attente");
  });

  it("should release a locked address back to the sync", async () => {
    asUser(admin);
    await actions.safeAttachDinumEmailToMember(member.username, email, {
      confirmMove: true,
    });
    const res = await actions.safeReleaseDinumEmail(member.username, email);
    expect(res.success, res.message).to.be.true;
    expect((await getRow()).user_id_locked_by).to.be.null;
  });

  it("should refuse an address removed from Dimail", async () => {
    await db
      .updateTable("dinum_emails")
      .set({ status: "deleted" })
      .where("email", "=", email)
      .execute();
    asUser(admin);
    const res = await actions.safeAttachDinumEmailToMember(
      member.username,
      email,
      { confirmMove: true },
    );
    expect(res.success).to.be.false;
    expect((await getRow()).user_id_locked_by).to.be.null;
  });

  it("should refuse a non admin on every action, and an unknown address", async () => {
    asUser(member.username);
    let res = await actions.safeAttachDinumEmailToMember(
      member.username,
      email,
      { confirmMove: true },
    );
    expect(res.success).to.be.false;
    expect((await getRow()).user_id).to.equal(otherUuid);
    expect((await actions.safeGetMemberDinumEmails(member.username)).success).to
      .be.false;
    expect(
      (await actions.safeReleaseDinumEmail(member.username, email)).success,
    ).to.be.false;
    asUser(admin);
    res = await actions.safeAttachDinumEmailToMember(
      member.username,
      "unknown@attach-test.beta.gouv.fr",
    );
    expect(res.success).to.be.false;
  });

  it("should refuse an admin whose session has no second factor", async () => {
    asUser(admin, "eidas1");
    const res = await actions.safeAttachDinumEmailToMember(
      member.username,
      email,
      { confirmMove: true },
    );
    expect(res.success).to.be.false;
    expect(res.message).to.include("ProConnect");
    expect((await getRow()).user_id).to.equal(otherUuid);
  });
});
