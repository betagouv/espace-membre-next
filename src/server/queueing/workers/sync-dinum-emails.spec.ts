import chai from "chai";
import sinon from "sinon";
import proxyquire from "proxyquire";

import { getUserNameFromEmail } from "./sync-dinum-emails";

const expect = chai.expect;

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
  let getAllMailboxesStub: sinon.SinonStub;
  let getAllAliasesStub: sinon.SinonStub;
  let dbStub: any;
  let syncDinumEmailsJob: (domain: string) => Promise<void>;

  beforeEach(() => {
    getAllMailboxesStub = sinon.stub();
    getAllAliasesStub = sinon.stub();
    dbStub = {
      selectFrom: sinon.stub().returns({
        select: sinon.stub().returns({
          where: sinon
            .stub()
            .returns({ executeTakeFirst: sinon.stub().returns({}) }),
        }),
      }),
      insertInto: sinon.stub().returns({
        values: sinon.stub().returns({
          onConflict: sinon.stub().returns({
            execute: sinon.stub().resolves(),
          }),
        }),
      }),
    };

    const module = proxyquire(
      "./sync-dinum-emails",
      {
        "@/lib/dimail/client": {
          getAllMailboxes: getAllMailboxesStub,
          getAllAliases: getAllAliasesStub,
        },
        "@/lib/kysely": {
          db: dbStub,
        },
      },
    );

    syncDinumEmailsJob = module.syncDinumEmailsJob;
  });

  afterEach(() => {
    sinon.restore();
  });

  it("should sync dinum emails correctly without duplicates", async () => {
    // Set environment variable
    process.env.DIMAIL_MAILBOX_DOMAIN = "test.com";

    // Mock getAllMailboxes response
    getAllMailboxesStub.resolves({
      success: true,
      mailboxes: [
        { type: "mailbox", email: "user1@test.com", status: "active" },
        { type: "mailbox", email: "user2@test.com", status: "inactive" },
      ],
    });

    // Mock getAllAliases response
    getAllAliasesStub.resolves({
      success: true,
      aliases: [
        {
          username: "alias1",
          domain: "test.com",
          destination: "user1@test.com",
        },
        {
          username: "alias2",
          domain: "test.com",
          destination: "user2@test.com",
        },
      ],
    });

    await syncDinumEmailsJob("test.com");

    // Assert that insertInto was called with "dinum_emails"
    expect(dbStub.insertInto.calledWith("dinum_emails")).to.be.true;

    // Get the values method
    const valuesStub = dbStub.insertInto().values;
    expect(valuesStub.calledOnce).to.be.true;

    // Get the inserted data
    const insertedData = valuesStub.firstCall.args[0];

    // Expected data: 2 mailboxes + 2 aliases = 4 items
    expect(insertedData).to.have.length(4);

    // Check mailboxes
    const mailbox1 = insertedData.find(
      (item: any) => item.email === "user1@test.com",
    );
    expect(mailbox1).to.deep.include({
      type: "mailbox",
      email: "user1@test.com",
      status: "active",
      destination: null,
    });

    const mailbox2 = insertedData.find(
      (item: any) => item.email === "user2@test.com",
    );
    expect(mailbox2).to.deep.include({
      type: "mailbox",
      email: "user2@test.com",
      status: "inactive",
      destination: null,
    });

    // Check aliases
    const alias1 = insertedData.find(
      (item: any) => item.email === "alias1@test.com",
    );
    expect(alias1).to.deep.include({
      type: "alias",
      email: "alias1@test.com",
      destination: "user1@test.com",
      status: "enabled",
    });

    const alias2 = insertedData.find(
      (item: any) => item.email === "alias2@test.com",
    );
    expect(alias2).to.deep.include({
      type: "alias",
      email: "alias2@test.com",
      destination: "user2@test.com",
      status: "enabled",
    });

    // Assert that onConflict was called
    const onConflictStub = dbStub.insertInto().values().onConflict;
    expect(onConflictStub.calledOnce).to.be.true;

    // Assert that execute was called
    const executeStub = dbStub.insertInto().values().onConflict().execute;
    expect(executeStub.calledOnce).to.be.true;
  });

  it("should filter out duplicate emails", async () => {
    process.env.DIMAIL_MAILBOX_DOMAIN = "test.com";

    // Mock responses with a duplicate email
    getAllMailboxesStub.resolves({
      success: true,
      mailboxes: [
        { type: "mailbox", email: "user1@test.com", status: "active" },
      ],
    });

    getAllAliasesStub.resolves({
      success: true,
      aliases: [
        {
          username: "user1",
          domain: "test.com",
          destination: "somewhere@test.com",
        }, // Same email as mailbox
      ],
    });

    await syncDinumEmailsJob("test.com");

    const insertedData = dbStub.insertInto().values.firstCall.args[0];

    // Should only have 1 item, the mailbox (first in array)
    expect(insertedData).to.have.length(1);
    expect(insertedData[0]).to.deep.include({
      type: "mailbox",
      email: "user1@test.com",
      status: "active",
      destination: null,
    });
  });

  it("should handle empty responses", async () => {
    process.env.DIMAIL_MAILBOX_DOMAIN = "test.com";

    getAllMailboxesStub.resolves({
      success: true,
      mailboxes: [],
    });

    getAllAliasesStub.resolves({
      success: true,
      aliases: [],
    });

    await syncDinumEmailsJob("test.com");

    const insertedData = dbStub.insertInto().values.firstCall.args[0];
    expect(insertedData).to.have.length(0);
  });
});
