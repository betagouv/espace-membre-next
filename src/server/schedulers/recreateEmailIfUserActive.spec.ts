import { expect } from "chai";
import proxyquire from "proxyquire";
import sinon from "sinon";

import { db } from "@/lib/kysely";
import { Domaine, EmailStatusCode } from "@/models/member";
import { createData, deleteData } from "__tests__/utils/fakeData";

describe("recreateEmailIfUserActive", () => {
  const member = {
    username: "recreate.member",
    primary_email: "recreate.member@beta.gouv.fr",
    secondary_email: "recreate.member@example.com",
    domaine: Domaine.DEVELOPPEMENT,
    missions: [
      {
        start: new Date("2020-01-01"),
        end: new Date("2099-01-01"),
        status: "independent",
        employer: "octo",
      },
    ],
  };
  let uuid: string;
  let patchMailboxStub: sinon.SinonStub;
  let createMailboxStub: sinon.SinonStub;
  let recreateEmailIfUserActive: () => Promise<void>;

  const setPrimary = (primary_email: string) =>
    db
      .updateTable("users")
      .set({
        primary_email,
        primary_email_status: EmailStatusCode.EMAIL_SUSPENDED,
      })
      .where("uuid", "=", uuid)
      .execute();
  const addRow = (row: {
    email: string;
    type: string;
    status?: string;
    destination?: string;
  }) =>
    db
      .insertInto("dinum_emails")
      .values({ status: "disabled", ...row, user_id: uuid })
      .execute();
  const getStatus = async () =>
    (
      await db
        .selectFrom("users")
        .select("primary_email_status")
        .where("uuid", "=", uuid)
        .executeTakeFirstOrThrow()
    ).primary_email_status;

  beforeEach(async () => {
    patchMailboxStub = sinon.stub().resolves({ success: true });
    createMailboxStub = sinon.stub().resolves();
    recreateEmailIfUserActive = proxyquire("./recreateEmailIfUserActive", {
      "@/lib/dimail/client": { patchMailbox: patchMailboxStub },
      "../queueing/workers/create-dimail-mailbox": {
        createDimailMailboxForUser: createMailboxStub,
      },
    }).recreateEmailIfUserActive;
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
    await deleteData({ users: [member] });
  });

  it("should reactivate the mailbox an alias primary email points to, on its own domain", async () => {
    await setPrimary("recreate.member@beta.gouv.fr");
    await addRow({
      email: "recreate.member@beta.gouv.fr",
      type: "alias",
      status: "enabled",
      destination: "recreate.member@ext.beta.gouv.fr",
    });
    await addRow({
      email: "recreate.member@ext.beta.gouv.fr",
      type: "mailbox",
    });
    await recreateEmailIfUserActive();
    expect(patchMailboxStub.calledOnce).to.be.true;
    expect(patchMailboxStub.firstCall.args[0]).to.deep.equal({
      domain_name: "ext.beta.gouv.fr",
      user_name: "recreate.member",
      data: { imap_active: "yes" },
    });
    expect(createMailboxStub.notCalled).to.be.true;
    expect(await getStatus()).to.equal(EmailStatusCode.EMAIL_ACTIVE);
  });

  it("should reactivate the mailbox of a member whose primary email is elsewhere, without creating one", async () => {
    await setPrimary("recreate.member@ademe.gouv.fr");
    await addRow({ email: "recreate.member@beta.gouv.fr", type: "mailbox" });
    await recreateEmailIfUserActive();
    expect(patchMailboxStub.firstCall.args[0]).to.include({
      domain_name: "beta.gouv.fr",
      user_name: "recreate.member",
    });
    expect(createMailboxStub.notCalled).to.be.true;
  });

  it("should create a mailbox for a member who has none", async () => {
    await setPrimary("recreate.member@beta.gouv.fr");
    await recreateEmailIfUserActive();
    expect(patchMailboxStub.notCalled).to.be.true;
    expect(createMailboxStub.calledWith(uuid)).to.be.true;
  });

  it("should ignore rows removed from Dimail, and create a mailbox when none is left", async () => {
    await setPrimary("recreate.member@beta.gouv.fr");
    await addRow({
      email: "recreate.member@beta.gouv.fr",
      type: "mailbox",
      status: "deleted",
    });
    await recreateEmailIfUserActive();
    expect(patchMailboxStub.notCalled).to.be.true;
    expect(createMailboxStub.calledWith(uuid)).to.be.true;
  });

  it("should prefer the current domain over the legacy ext one", async () => {
    await setPrimary("recreate.member@ademe.gouv.fr");
    await addRow({
      email: "recreate.member.ext@ext.beta.gouv.fr",
      type: "mailbox",
    });
    await addRow({ email: "recreate.member@beta.gouv.fr", type: "mailbox" });
    await recreateEmailIfUserActive();
    expect(patchMailboxStub.firstCall.args[0]).to.include({
      domain_name: "beta.gouv.fr",
    });
  });

  it("should leave the member suspended when Dimail refuses the reactivation", async () => {
    patchMailboxStub.resolves({ success: false });
    await setPrimary("recreate.member@beta.gouv.fr");
    await addRow({ email: "recreate.member@beta.gouv.fr", type: "mailbox" });
    await recreateEmailIfUserActive();
    expect(await getStatus()).to.equal(EmailStatusCode.EMAIL_SUSPENDED);
  });
});
