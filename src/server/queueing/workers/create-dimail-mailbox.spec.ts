import { expect } from "chai";
import sinon from "sinon";
import proxyquire from "proxyquire";

// Mock dependencies
const mockGetUserBasicInfo = sinon.stub();
const mockCreateMailbox = sinon.stub();
const mockSendEmail = sinon.stub();
const mockCreateAlias = sinon.stub();

// Mock Kysely database
const mockExecute = sinon.stub();
const mockWhere = sinon.stub().returns({ execute: mockExecute });
const mockSet = sinon.stub().returns({ where: mockWhere });
const mockUpdateTable = sinon.stub().returns({ set: mockSet });
const mockOnConflict = sinon.stub().returns({ execute: mockExecute });
const mockValues = sinon.stub().returns({ onConflict: mockOnConflict });
const mockInsertInto = sinon.stub().returns({ values: mockValues });

const userTestUuid = "9f58ae81-3580-4d37-9334-a979dcc2372f";

// Mock constants
const DIMAIL_MAILBOX_DOMAIN =
  process.env.DIMAIL_MAILBOX_DOMAIN || "test-opi-email.beta.gouv.fr";

const mockDb = {
  updateTable: mockUpdateTable,
  insertInto: mockInsertInto,
};

const { createDimailMailboxForUser } = proxyquire("./create-dimail-mailbox", {
  "@/lib/kysely/queries/users": { getUserBasicInfo: mockGetUserBasicInfo },
  "@lib/dimail/client": {
    createMailbox: mockCreateMailbox,
    createAlias: mockCreateAlias,
  },
  "@/server/config/email.config": { sendEmail: mockSendEmail },
  "@/lib/kysely": { db: mockDb },
});

describe("create-dimail-mail", () => {
  let consoleErrorStub: sinon.SinonStub;

  beforeEach(() => {
    // Reset all stubs
    sinon.resetHistory();

    // Mock console methods
    consoleErrorStub = sinon.stub(console, "error");

    // Mock process.env
    process.env.DIMAIL_WEBMAIL_URL = "https://webmail.beta.gouv.fr/";

    // Setup default mock implementations
    mockGetUserBasicInfo.resolves({
      uuid: userTestUuid,
      username: "john.doe",
      fullname: "John Doe",
      secondary_email: "john.doe@example.com",
      primary_email: `john.doe@${DIMAIL_MAILBOX_DOMAIN}`,
      legal_status: "something",
      missions: [],
    });

    mockCreateMailbox.resolves({
      email: `john.doe.ext@${DIMAIL_MAILBOX_DOMAIN}`,
      password: "generated-password",
    });

    mockSendEmail.resolves();
    mockCreateAlias.resolves();
    mockExecute.resolves();
  });

  afterEach(() => {
    sinon.restore();
  });

  it("should create a DIMAIL mailbox successfully with all expected calls for external user", async () => {
    // Arrange
    const userUuid = userTestUuid;

    // Act
    const result = await createDimailMailboxForUser(userUuid);

    // correct email is created
    expect(result).to.equal(`john.doe.ext@${DIMAIL_MAILBOX_DOMAIN}`);

    // getUserBasicInfo is called for the user
    expect(
      mockGetUserBasicInfo.calledOnceWith({ uuid: userUuid }),
      `${mockGetUserBasicInfo.getCalls()}`,
    ).to.be.true;

    // createMailbox is called with expected parameters
    expect(
      mockCreateMailbox.calledOnceWith({
        user_name: "john.doe.ext",
        domain: DIMAIL_MAILBOX_DOMAIN,
        displayName: "John Doe",
        surName: "John",
        givenName: "Doe",
      }),
      `createMailbox should be called with correct parameters. instead got ${JSON.stringify(mockCreateMailbox.firstCall && mockCreateMailbox.firstCall.args)}`,
    ).to.be.true;

    // sendEmail is called with expected parameters
    expect(
      mockSendEmail.calledOnceWith({
        toEmail: ["john.doe@example.com"],
        type: "EMAIL_CREATED_DIMAIL",
        variables: {
          email: `john.doe.ext@${DIMAIL_MAILBOX_DOMAIN}`,
          password: "generated-password",
          webmailUrl: "https://webmail.beta.gouv.fr/",
        },
      }),
      `mockSendEmail should be called with correct parameters. instead got ${JSON.stringify(mockSendEmail.firstCall && mockSendEmail.firstCall.args)}`,
    ).to.be.true;

    // createAlias is called with expected parameters
    expect(
      mockCreateAlias.calledOnceWith({
        user_name: "john.doe",
        domain: DIMAIL_MAILBOX_DOMAIN,
        destination: `john.doe.ext@${DIMAIL_MAILBOX_DOMAIN}`,
      }),
      `mockCreateAlias should be called with correct parameters. instead got ${JSON.stringify(mockCreateAlias.firstCall && mockCreateAlias.firstCall.args)}`,
    ).to.be.true;

    // Verify database updates
    expect(
      mockUpdateTable.calledOnceWith("users"),
      `should update users table ${JSON.stringify(mockUpdateTable.firstCall && mockUpdateTable.firstCall.args)}`,
    ).to.be.true;

    expect(
      mockSet.calledOnceWith({
        primary_email: `john.doe@${DIMAIL_MAILBOX_DOMAIN}`,
        primary_email_status: "EMAIL_ACTIVE",
      }),
      `should update users table with correct values. got ${JSON.stringify(mockSet.firstCall && mockSet.firstCall.args)}`,
    ).to.be.true;
    expect(
      mockWhere.calledOnceWith("uuid", "=", userUuid),
      "should update correct uuid",
    ).to.be.true;

    // Verify dinum_emails insert

    expect(
      mockInsertInto.getCall(0).calledWith("dinum_emails"),
      "should update table dinum_emails",
    ).to.be.true;
    expect(
      mockInsertInto.getCall(1).calledWith("dinum_emails"),
      "should update table dinum_emails",
    ).to.be.true;

    expect(
      mockValues.getCall(0).calledWithExactly({
        email: `john.doe.ext@${DIMAIL_MAILBOX_DOMAIN}`,
        type: "mailbox",
        status: "ok",
        user_id: userTestUuid,
      }),
      `should update table dinum_emails with new email, got ${JSON.stringify(mockValues.getCall(0).args)}`,
    ).to.be.true;
    expect(
      mockValues.getCall(1).calledWithExactly({
        email: `john.doe@${DIMAIL_MAILBOX_DOMAIN}`,
        type: "alias",
        status: "enabled",
        destination: `john.doe.ext@${DIMAIL_MAILBOX_DOMAIN}`,
        user_id: userTestUuid,
      }),
      `should update table dinum_emails with new alias, got ${JSON.stringify(mockValues.getCall(1).args)}`,
    ).to.be.true;

    // Verify execute calls
    expect(mockExecute.calledThrice, "should execute 3 queries").to.be.true;
  });

  it("should throw error when user is not found", async () => {
    // Arrange
    const userUuid = "non-existent-user";
    mockGetUserBasicInfo.resolves(null);

    // Act & Assert
    try {
      await createDimailMailboxForUser(userUuid);
      expect.fail("Should have thrown an error");
    } catch (error) {
      // @ts-ignore
      expect(error.message).to.equal(`User ${userUuid} not found`);
    }
  });

  it("should throw error when user has no secondary email", async () => {
    mockGetUserBasicInfo.resolves({
      uuid: userTestUuid,
      username: "john.doe",
      fullname: "John Doe",
      secondary_email: null,
      primary_email: `john.doe@${DIMAIL_MAILBOX_DOMAIN}`,
      legal_status: "something",
      missions: [],
    });
    // Arrange
    const userUuid = userTestUuid;

    // Act & Assert
    try {
      await createDimailMailboxForUser(userUuid);
      expect.fail("Should have thrown an error");
    } catch (error) {
      // @ts-ignore
      expect(error.message).to.equal(
        `User ${userTestUuid} has no secondary_email`,
      );
    }
  });

  it("should not create alias when primary_email does not end with DIMAIL domain", async () => {
    mockSendEmail.reset();
    mockCreateAlias.reset();
    mockGetUserBasicInfo.resolves({
      uuid: userTestUuid,
      username: "john.doe",
      fullname: "John Doe",
      secondary_email: "john.doe@example.com",
      primary_email: `some.thing@some.email`,
      legal_status: "something",
      missions: [],
    });

    // Arrange
    const userUuid = userTestUuid;

    // Act
    await createDimailMailboxForUser(userUuid);

    // sendEmail is called with expected parameters
    expect(
      mockSendEmail.calledOnceWith({
        toEmail: ["john.doe@example.com"],
        type: "EMAIL_CREATED_DIMAIL",
        variables: {
          email: `john.doe.ext@${DIMAIL_MAILBOX_DOMAIN}`,
          password: "generated-password",
          webmailUrl: "https://webmail.beta.gouv.fr/",
        },
      }),
      `mockSendEmail should be called with correct parameters. instead got ${JSON.stringify(mockSendEmail.firstCall && mockSendEmail.getCalls())}`,
    ).to.be.true;

    // createAlias is not called
    expect(mockCreateAlias.called).to.be.false;
  });

  it("should not create alias when primary_email is the same as new email", async () => {
    mockGetUserBasicInfo.resolves({
      uuid: userTestUuid,
      username: "john.doe",
      fullname: "John Doe",
      secondary_email: "john.doe@example.com",
      primary_email: `john.doe@${DIMAIL_MAILBOX_DOMAIN}`,
      legal_status: "fonctionnaire",
      missions: [],
    });
    mockCreateMailbox.resolves({
      email: `john.doe@${DIMAIL_MAILBOX_DOMAIN}`,
      password: "generated-password",
    });

    // Arrange
    const userUuid = userTestUuid;

    // Act
    await createDimailMailboxForUser(userUuid);

    // Assert
    expect(
      mockCreateAlias.called,
      `Got ${JSON.stringify(mockCreateAlias.getCalls())}`,
    ).to.be.false;
  });

  it("should split names correctly", async () => {
    mockCreateMailbox.reset();
    mockGetUserBasicInfo.resolves({
      uuid: userTestUuid,
      username: "john.doe-machin",
      fullname: "John Doe Machin",
      secondary_email: "john.doe-machin@example.com",
      primary_email: `john.doe-machin@${DIMAIL_MAILBOX_DOMAIN}`,
      legal_status: "autre",
      missions: [],
    });
    mockCreateMailbox.resolves({
      email: `john.doe-machin.ext@${DIMAIL_MAILBOX_DOMAIN}`,
      password: "generated-password",
    });

    // Arrange
    const userUuid = userTestUuid;

    // Act
    await createDimailMailboxForUser(userUuid);

    // Assert

    expect(
      mockCreateMailbox.calledOnceWith({
        user_name: "john.doe-machin.ext",
        domain: DIMAIL_MAILBOX_DOMAIN,
        displayName: "John Doe Machin",
        surName: "John",
        givenName: "Doe Machin",
      }),
      `createMailbox should be called with correct parameters. instead got ${JSON.stringify(mockCreateMailbox.firstCall && mockCreateMailbox.firstCall.args)}`,
    ).to.be.true;

    expect(
      mockCreateAlias.called,
      `Got ${JSON.stringify(mockCreateAlias.getCalls())}`,
    ).to.be.true;
  });
});
