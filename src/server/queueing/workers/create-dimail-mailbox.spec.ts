import { expect } from "chai";
import sinon from "sinon";
import proxyquire from "proxyquire";

// Mock dependencies
const mockGetUserBasicInfo = sinon.stub();
const mockCreateMailbox = sinon.stub();
const mockSendEmail = sinon.stub();
const mockCreateMailboxCode = sinon.stub();

// Mock Kysely database
const mockExecute = sinon.stub();
const mockWhere = sinon.stub().returns({ execute: mockExecute });
const mockSet = sinon.stub().returns({ where: mockWhere });
const mockUpdateTable = sinon.stub().returns({ set: mockSet });
const mockOnConflict = sinon.stub().returns({ execute: mockExecute });
const mockValues = sinon.stub().returns({ onConflict: mockOnConflict });
const mockInsertInto = sinon.stub().returns({ values: mockValues });
// latest mission lookup (selectFrom missions)
const mockLastMission = sinon.stub();
const mockSelectBuilder: any = {
  select: sinon.stub().returnsThis(),
  where: sinon.stub().returnsThis(),
  orderBy: sinon.stub().returnsThis(),
  executeTakeFirst: mockLastMission,
};
// mailbox already recorded lookup (selectFrom dinum_emails)
const mockExistingMailbox = sinon.stub();
const mockDinumSelectBuilder: any = {
  select: sinon.stub().returnsThis(),
  where: sinon.stub().returnsThis(),
  executeTakeFirst: mockExistingMailbox,
};
const mockSelectFrom = sinon
  .stub()
  .callsFake((table: string) =>
    table === "dinum_emails" ? mockDinumSelectBuilder : mockSelectBuilder,
  );
const mockGetLastEvent = sinon.stub();
const mockSendInvitation = sinon.stub();

const userTestUuid = "9f58ae81-3580-4d37-9334-a979dcc2372f";

// Mock constants
const DIMAIL_MAILBOX_DOMAIN =
  process.env.DIMAIL_MAILBOX_DOMAIN || "test-opi-email.beta.gouv.fr";

const mockDb = {
  updateTable: mockUpdateTable,
  insertInto: mockInsertInto,
  selectFrom: mockSelectFrom,
};

const { createDimailMailboxForUser, onboardNewMemberMailbox } = proxyquire(
  "./create-dimail-mailbox",
  {
    "@/lib/kysely/queries/users": { getUserBasicInfo: mockGetUserBasicInfo },
    "@/lib/dimail/client": {
      createMailbox: mockCreateMailbox,
      createMailboxCode: mockCreateMailboxCode,
    },
    "@/server/config/email.config": { sendEmail: mockSendEmail },
    "@/lib/kysely": { db: mockDb },
    "@/lib/events": { getLastEvent: mockGetLastEvent },
    "@/lib/email/send-verification-email": {
      sendNewMemberVerificationEmail: mockSendInvitation,
    },
  },
);

describe("create-dimail-mail", () => {
  let consoleErrorStub: sinon.SinonStub;

  beforeEach(() => {
    // Reset all stubs
    sinon.resetHistory();
    // module-level stubs are not reached by sinon.resetHistory() once
    // sinon.restore() ran, so reset them explicitly
    [
      mockGetUserBasicInfo,
      mockCreateMailbox,
      mockSendEmail,
      mockExecute,
      mockWhere,
      mockSet,
      mockUpdateTable,
      mockOnConflict,
      mockValues,
      mockInsertInto,
      mockLastMission,
      mockExistingMailbox,
      mockCreateMailboxCode,
      mockSelectFrom,
      mockGetLastEvent,
      mockSendInvitation,
    ].forEach((stub) => stub.resetHistory());

    // Mock console methods
    consoleErrorStub = sinon.stub(console, "error");

    // no waiting in tests, except where the delay itself is tested
    process.env.DIMAIL_INVITATION_DELAY_MS = "0";

    // Mock process.env
    process.env.DIMAIL_WEBMAIL_URL = "https://messagerie.numerique.gouv.fr";

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
    mockCreateMailboxCode.resolves({
      email: `john.doe.ext@${DIMAIL_MAILBOX_DOMAIN}`,
      code: "test-access-code",
      expires_at: Date.now() + 3600000,
      expires_in: 3600,
      maxuse: 1,
      nbuse: 0,
    });
    mockExecute.resolves();
    mockLastMission.resolves(undefined);
    mockExistingMailbox.resolves(undefined);
    mockGetLastEvent.resolves(null);
    mockSendInvitation.resolves();
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
          webmailUrl:
            "https://messagerie.numerique.gouv.fr/code/test-access-code",
        },
      }),
      `mockSendEmail should be called with correct parameters. instead got ${JSON.stringify(mockSendEmail.firstCall && mockSendEmail.firstCall.args)}`,
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
      mockValues.getCall(0).calledWithExactly({
        email: `john.doe.ext@${DIMAIL_MAILBOX_DOMAIN}`,
        type: "mailbox",
        status: "ok",
        user_id: userTestUuid,
      }),
      `should update table dinum_emails with new email, got ${JSON.stringify(mockValues.getCall(0).args)}`,
    ).to.be.true;

    // Verify execute calls : dinum_emails insert + users update
    expect(mockExecute.calledTwice, "should execute 2 queries").to.be.true;
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
  });

  it("should always add .ext for an attributaire, even with an admin mission or a public legal status", async () => {
    mockGetUserBasicInfo.resolves({
      uuid: userTestUuid,
      username: "john.doe",
      fullname: "John Doe",
      secondary_email: "john.doe@example.com",
      primary_email: null,
      legal_status: "fonctionnaire",
      domaine: "Attributaire",
      missions: [],
    });
    mockLastMission.resolves({ status: "admin" });
    mockCreateMailbox.resolves({
      email: `john.doe.ext@${DIMAIL_MAILBOX_DOMAIN}`,
    });

    await createDimailMailboxForUser(userTestUuid);

    expect(mockCreateMailbox.firstCall.args[0].user_name).to.equal(
      "john.doe.ext",
    );
  });

  it("should not add .ext for a new member (no legal_status) whose latest mission is admin", async () => {
    mockGetUserBasicInfo.resolves({
      uuid: userTestUuid,
      username: "john.doe",
      fullname: "John Doe",
      secondary_email: "john.doe@example.com",
      primary_email: null,
      legal_status: null,
      missions: [],
    });
    mockLastMission.resolves({ status: "admin" });
    mockCreateMailbox.resolves({
      email: `john.doe@${DIMAIL_MAILBOX_DOMAIN}`,
      password: "generated-password",
    });

    await createDimailMailboxForUser(userTestUuid);

    expect(mockSelectFrom.calledWith("missions")).to.be.true;
    expect(mockCreateMailbox.firstCall.args[0].user_name).to.equal("john.doe");
  });

  it("should write the given status instead of EMAIL_ACTIVE", async () => {
    await createDimailMailboxForUser(userTestUuid, {
      status: "EMAIL_VERIFICATION_WAITING",
    });
    expect(mockSet.firstCall.args[0].primary_email_status).to.equal(
      "EMAIL_VERIFICATION_WAITING",
    );
  });

  it("should record the mailbox in dinum_emails before sending the access link", async () => {
    await createDimailMailboxForUser(userTestUuid);

    expect(mockInsertInto.calledWith("dinum_emails")).to.be.true;
    expect(mockInsertInto.calledBefore(mockCreateMailboxCode)).to.be.true;
    expect(mockInsertInto.calledBefore(mockSendEmail)).to.be.true;
  });

  it("should not update the user when the access code fails", async () => {
    mockCreateMailboxCode.rejects(new Error("code failed"));

    try {
      await createDimailMailboxForUser(userTestUuid);
      expect.fail("Should have thrown");
    } catch (e: any) {
      expect(e.message).to.equal("code failed");
    }
    // the mailbox is recorded so the retry can resume, the user is left untouched
    expect(mockInsertInto.calledWith("dinum_emails")).to.be.true;
    expect(mockSendEmail.called).to.be.false;
    expect(mockUpdateTable.called).to.be.false;
  });

  it("on retry, should not recreate a mailbox already recorded and should send the access link", async () => {
    mockExistingMailbox.resolves({
      email: `john.doe.ext@${DIMAIL_MAILBOX_DOMAIN}`,
    });

    const result = await createDimailMailboxForUser(userTestUuid);

    expect(result).to.equal(`john.doe.ext@${DIMAIL_MAILBOX_DOMAIN}`);
    expect(mockCreateMailbox.called).to.be.false;
    expect(mockCreateMailboxCode.calledOnce).to.be.true;
    expect(mockSendEmail.calledOnce).to.be.true;
    expect(mockSendEmail.firstCall.args[0].variables).to.deep.equal({
      email: `john.doe.ext@${DIMAIL_MAILBOX_DOMAIN}`,
      webmailUrl: "https://messagerie.numerique.gouv.fr/code/test-access-code",
    });
    expect(mockSet.firstCall.args[0].primary_email_status).to.equal(
      "EMAIL_ACTIVE",
    );
  });

  describe("onboardNewMemberMailbox", () => {
    const onboardingUser = {
      uuid: userTestUuid,
      username: "john.doe",
      fullname: "John Doe",
      secondary_email: "john.doe@example.com",
      primary_email: null,
      primary_email_status: "EMAIL_CREATION_WAITING",
      legal_status: null,
      missions: [],
    };

    it("creates the mailbox, then sends the ProConnect invitation", async () => {
      mockGetUserBasicInfo.resolves(onboardingUser);

      await onboardNewMemberMailbox(userTestUuid);

      expect(mockCreateMailbox.calledOnce).to.be.true;
      expect(mockSet.firstCall.args[0].primary_email_status).to.equal(
        "EMAIL_VERIFICATION_WAITING",
      );
      expect(mockSendInvitation.calledOnceWith({ userId: userTestUuid })).to.be
        .true;
      // the invitation is sent only once the mailbox is created and saved
      expect(mockSendInvitation.calledAfter(mockCreateMailbox)).to.be.true;
      expect(mockSendInvitation.calledAfter(mockSet)).to.be.true;
    });

    it("waits before sending the invitation to a mailbox that was just created", async () => {
      process.env.DIMAIL_INVITATION_DELAY_MS = "60";
      mockGetUserBasicInfo.resolves(onboardingUser);

      const start = Date.now();
      await onboardNewMemberMailbox(userTestUuid);

      expect(mockSendInvitation.calledOnce).to.be.true;
      expect(Date.now() - start).to.be.at.least(55);
    });

    it("does not wait when the mailbox was created by a previous attempt", async () => {
      process.env.DIMAIL_INVITATION_DELAY_MS = "5000";
      mockGetUserBasicInfo.resolves({
        ...onboardingUser,
        primary_email: `john.doe.ext@${DIMAIL_MAILBOX_DOMAIN}`,
        primary_email_status: "EMAIL_VERIFICATION_WAITING",
      });

      const start = Date.now();
      await onboardNewMemberMailbox(userTestUuid);

      expect(mockSendInvitation.calledOnce).to.be.true;
      expect(Date.now() - start).to.be.below(1000);
    });

    it("does not send the invitation when the mailbox creation fails", async () => {
      mockGetUserBasicInfo.resolves(onboardingUser);
      mockCreateMailbox.rejects(new Error("dimail down"));

      try {
        await onboardNewMemberMailbox(userTestUuid);
        expect.fail("Should have thrown");
      } catch (e: any) {
        expect(e.message).to.equal("dimail down");
      }
      expect(mockSendInvitation.called).to.be.false;
    });

    it("on retry after a failed access link, resumes without recreating the mailbox", async () => {
      // first attempt : mailbox created, then the access email fails
      mockGetUserBasicInfo.resolves(onboardingUser);
      mockSendEmail.rejects(new Error("smtp down"));
      try {
        await onboardNewMemberMailbox(userTestUuid);
        expect.fail("Should have thrown");
      } catch (e: any) {
        expect(e.message).to.equal("smtp down");
      }
      expect(mockCreateMailbox.calledOnce).to.be.true;
      expect(mockSendInvitation.called).to.be.false;

      // pg-boss retry : the user is still EMAIL_CREATION_WAITING, the mailbox is recorded
      mockSendEmail.resolves();
      mockExistingMailbox.resolves({
        email: `john.doe.ext@${DIMAIL_MAILBOX_DOMAIN}`,
      });
      await onboardNewMemberMailbox(userTestUuid);

      expect(mockCreateMailbox.calledOnce).to.be.true;
      expect(mockSendEmail.calledTwice).to.be.true;
      expect(mockSet.firstCall.args[0].primary_email_status).to.equal(
        "EMAIL_VERIFICATION_WAITING",
      );
      expect(mockSendInvitation.calledOnce).to.be.true;
    });

    it("on retry, does not recreate an existing mailbox and sends the invitation once", async () => {
      mockCreateMailbox.resetHistory();
      mockGetUserBasicInfo.resolves({
        ...onboardingUser,
        primary_email: `john.doe.ext@${DIMAIL_MAILBOX_DOMAIN}`,
        primary_email_status: "EMAIL_VERIFICATION_WAITING",
      });

      await onboardNewMemberMailbox(userTestUuid);

      expect(mockCreateMailbox.called).to.be.false;
      expect(mockSendInvitation.calledOnce).to.be.true;
    });

    it("does not send the invitation twice", async () => {
      mockGetUserBasicInfo.resolves({
        ...onboardingUser,
        primary_email: `john.doe.ext@${DIMAIL_MAILBOX_DOMAIN}`,
        primary_email_status: "EMAIL_VERIFICATION_WAITING",
      });
      mockGetLastEvent.resolves({
        action_code: "EMAIL_VERIFICATION_WAITING_SENT",
      });

      await onboardNewMemberMailbox(userTestUuid);

      expect(mockSendInvitation.called).to.be.false;
    });

    it("skips members that are not onboarding anymore", async () => {
      mockGetUserBasicInfo.resolves({
        ...onboardingUser,
        primary_email: `john.doe.ext@${DIMAIL_MAILBOX_DOMAIN}`,
        primary_email_status: "EMAIL_ACTIVE",
      });

      await onboardNewMemberMailbox(userTestUuid);

      expect(mockCreateMailbox.called).to.be.false;
      expect(mockSendInvitation.called).to.be.false;
    });
  });
});
