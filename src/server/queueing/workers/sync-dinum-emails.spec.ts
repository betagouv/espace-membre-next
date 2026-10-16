import { expect } from "chai";
import sinon from "sinon";
import proxyquire from "proxyquire";

import { db } from "@/lib/kysely";
import { EmailStatusCode } from "@/models/member";
import { createData, deleteData } from "__tests__/utils/fakeData";

import {
  getUserNameFromEmail,
  setEmailsActives,
  setEmailsSuspendeds,
} from "./sync-dinum-emails";

describe("getUserNameFromEmail", () => {
  it("should extract username from simple email", () => {
    expect(getUserNameFromEmail("john.doe@beta.gouv.fr")).to.equal("john.doe");
  });

  it("should extract username removing .ext suffix", () => {
    expect(getUserNameFromEmail("john.doe.ext@beta.gouv.fr")).to.equal(
      "john.doe",
    );
  });

  it("should handle username with hyphens", () => {
    expect(getUserNameFromEmail("jean-pierre@beta.gouv.fr")).to.equal(
      "jean-pierre",
    );
  });

  it("should handle complex username with dots and hyphens", () => {
    expect(
      getUserNameFromEmail("jean-pierre.dupont.ext@beta.gouv.fr"),
    ).to.equal("jean-pierre.dupont");
  });

  it("should handle username with multiple dots", () => {
    expect(getUserNameFromEmail("first.middle.last@beta.gouv.fr")).to.equal(
      "first.middle.last",
    );
  });

  it("should handle simple username without dots", () => {
    expect(getUserNameFromEmail("bob@beta.gouv.fr")).to.equal("bob");
  });

  it("should handle simple username with .ext suffix", () => {
    expect(getUserNameFromEmail("bob.ext@beta.gouv.fr")).to.equal("bob");
  });

  it("should handle different domains", () => {
    expect(getUserNameFromEmail("user@ext.beta.gouv.fr")).to.equal("user");
    expect(getUserNameFromEmail("user@other.com")).to.equal("user");
    expect(getUserNameFromEmail("user.ext@some.domain.fr")).to.equal("user");
  });
});

describe("syncDinumEmailsJob", () => {
  const domain = "sync-test.beta.gouv.fr";
  const member = {
    username: "sync.member",
    primary_email: "sync.member@numerique.gouv.fr",
    missions: [],
  };
  const other = {
    username: "sync.other",
    primary_email: "sync.other@numerique.gouv.fr",
    missions: [],
  };
  let getAllMailboxesStub: sinon.SinonStub;
  let getAllAliasesStub: sinon.SinonStub;
  let syncDinumEmailsJob: (domain: string) => Promise<void>;
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
  const getRow = (email: string) =>
    db
      .selectFrom("dinum_emails")
      .selectAll()
      .where("email", "=", email)
      .executeTakeFirst();
  const dimailAnswers = (
    mailboxes: { email: string; imap_active: "yes" | "no" }[],
    aliases: { username: string; destination: string }[] = [],
  ) => {
    getAllMailboxesStub.resolves({
      success: true,
      mailboxes: mailboxes.map((m) => ({ type: "mailbox", ...m })),
    });
    getAllAliasesStub.resolves({
      success: true,
      aliases: aliases.map((a) => ({ ...a, domain })),
    });
  };

  beforeEach(async () => {
    getAllMailboxesStub = sinon.stub();
    getAllAliasesStub = sinon.stub();
    syncDinumEmailsJob = proxyquire("./sync-dinum-emails", {
      "@/lib/dimail/client": {
        getAllMailboxes: getAllMailboxesStub,
        getAllAliases: getAllAliasesStub,
      },
    }).syncDinumEmailsJob;
    await createData({ users: [member, other] });
    memberUuid = await getUuid(member.username);
    otherUuid = await getUuid(other.username);
  });

  afterEach(async () => {
    sinon.restore();
    await db
      .deleteFrom("dinum_emails")
      .where("email", "ilike", `%@${domain}`)
      .execute();
    await deleteData({ users: [member, other] });
  });

  it("should store mailboxes and aliases, attached by username, without duplicates", async () => {
    dimailAnswers(
      [
        { email: `sync.member@${domain}`, imap_active: "yes" },
        { email: `sync.other@${domain}`, imap_active: "no" },
        { email: `sync.member@${domain}`, imap_active: "yes" },
      ],
      [{ username: "contact", destination: `sync.member@${domain}` }],
    );
    await syncDinumEmailsJob(domain);
    const member = await getRow(`sync.member@${domain}`);
    expect(member).to.include({
      type: "mailbox",
      status: "enabled",
      user_id: memberUuid,
    });
    expect(await getRow(`sync.other@${domain}`)).to.include({
      status: "disabled",
      user_id: otherUuid,
    });
    expect(await getRow(`contact@${domain}`)).to.include({
      type: "alias",
      destination: `sync.member@${domain}`,
    });
    const count = await db
      .selectFrom("dinum_emails")
      .select((eb) => eb.fn.countAll().as("n"))
      .where("email", "ilike", `%@${domain}`)
      .executeTakeFirstOrThrow();
    expect(Number(count.n)).to.equal(3);
  });

  it("should keep the member an admin attached an address to", async () => {
    await db
      .insertInto("dinum_emails")
      .values({
        email: `sync.member@${domain}`,
        type: "mailbox",
        status: "enabled",
        user_id: otherUuid,
        user_id_locked_by: "an.admin",
        user_id_locked_at: new Date(),
      })
      .execute();
    dimailAnswers([{ email: `sync.member@${domain}`, imap_active: "no" }]);
    await syncDinumEmailsJob(domain);
    expect(await getRow(`sync.member@${domain}`)).to.include({
      user_id: otherUuid,
      status: "disabled",
    });
  });

  const knownMailboxes = ["a", "b", "c", "d", "e"].map((local) => ({
    email: `${local}@${domain}`,
    imap_active: "yes" as const,
  }));

  it("should mark deleted the addresses Dimail no longer knows, and release their lock", async () => {
    await db
      .insertInto("dinum_emails")
      .values({
        email: `gone@${domain}`,
        type: "mailbox",
        status: "enabled",
        user_id: memberUuid,
        user_id_locked_by: "an.admin",
        user_id_locked_at: new Date(),
      })
      .execute();
    dimailAnswers(knownMailboxes, [
      { username: "contact", destination: `a@${domain}` },
    ]);
    await syncDinumEmailsJob(domain);
    expect(await getRow(`gone@${domain}`)).to.include({
      status: "deleted",
      user_id_locked_by: null,
      user_id_locked_at: null,
    });
    expect((await getRow(`a@${domain}`))?.status).to.equal("enabled");
  });

  it("should not delete when too many rows of a type disappear at once", async () => {
    await db
      .insertInto("dinum_emails")
      .values(
        ["x", "y", "z"].map((local) => ({
          email: `${local}@${domain}`,
          type: "mailbox",
          status: "enabled",
        })),
      )
      .execute();
    dimailAnswers([{ email: `a@${domain}`, imap_active: "yes" }]);
    await syncDinumEmailsJob(domain);
    expect((await getRow(`x@${domain}`))?.status).to.equal("enabled");
  });

  it("should not mark anything deleted on a failed or empty Dimail answer", async () => {
    await db
      .insertInto("dinum_emails")
      .values([
        { email: `kept@${domain}`, type: "mailbox", status: "enabled" },
        {
          email: `contact@${domain}`,
          type: "alias",
          status: "enabled",
          destination: `kept@${domain}`,
        },
      ])
      .execute();
    getAllMailboxesStub.resolves({ success: false });
    getAllAliasesStub.resolves({ success: true, aliases: [] });
    await syncDinumEmailsJob(domain);
    dimailAnswers([]);
    await syncDinumEmailsJob(domain);
    expect((await getRow(`kept@${domain}`))?.status).to.equal("enabled");
    expect((await getRow(`contact@${domain}`))?.status).to.equal("enabled");
  });
});

describe("primary email status from the Dimail mailboxes", () => {
  const domain = "status-test.beta.gouv.fr";
  const intra = {
    username: "status.intra",
    primary_email: "status.intra@ademe.gouv.fr",
    missions: [],
  };
  let uuid: string;

  const setStatus = (status: EmailStatusCode) =>
    db
      .updateTable("users")
      .set({ primary_email_status: status })
      .where("uuid", "=", uuid)
      .execute();
  const getStatus = async () =>
    (
      await db
        .selectFrom("users")
        .select("primary_email_status")
        .where("uuid", "=", uuid)
        .executeTakeFirstOrThrow()
    ).primary_email_status;
  const addMailbox = (local: string, status: string) =>
    db
      .insertInto("dinum_emails")
      .values({
        email: `${local}@${domain}`,
        type: "mailbox",
        status,
        user_id: uuid,
      })
      .execute();

  beforeEach(async () => {
    await createData({ users: [intra] });
    uuid = (
      await db
        .selectFrom("users")
        .select("uuid")
        .where("username", "=", intra.username)
        .executeTakeFirstOrThrow()
    ).uuid;
  });

  afterEach(async () => {
    await db.deleteFrom("dinum_emails").where("user_id", "=", uuid).execute();
    await deleteData({ users: [intra] });
  });

  it("should suspend a member whose mailboxes are all disabled, whatever the primary email", async () => {
    await setStatus(EmailStatusCode.EMAIL_ACTIVE);
    await addMailbox("status.intra", "disabled");
    await setEmailsSuspendeds();
    expect(await getStatus()).to.equal(EmailStatusCode.EMAIL_SUSPENDED);
  });

  it("should keep or set active a member with at least one enabled mailbox", async () => {
    await setStatus(EmailStatusCode.EMAIL_ACTIVE);
    await addMailbox("status.intra.old", "disabled");
    await addMailbox("status.intra", "enabled");
    await setEmailsSuspendeds();
    expect(await getStatus()).to.equal(EmailStatusCode.EMAIL_ACTIVE);
    await setStatus(EmailStatusCode.EMAIL_SUSPENDED);
    await setEmailsActives();
    expect(await getStatus()).to.equal(EmailStatusCode.EMAIL_ACTIVE);
  });
});
