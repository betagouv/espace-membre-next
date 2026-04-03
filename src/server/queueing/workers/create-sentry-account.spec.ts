import { expect } from "chai";
import sinon from "sinon";
import proxyquire from "proxyquire";
import PgBoss from "pg-boss";

const TEST_USER_UUID = "00000000-0000-0000-0000-000000000001";
const TEST_REQUEST_UUID = "00000000-0000-0000-0000-000000000099";

const makeJob = (data: Record<string, any>) =>
  ({ id: "job-1", name: "create-sentry-service-account", data } as PgBoss.Job<any>);

describe("createSentryServiceAccount()", () => {
  let mockSentryClient: {
    getAllUsers: sinon.SinonStub;
    addUserToOrganization: sinon.SinonStub;
    changeMemberRoleInTeam: sinon.SinonStub;
  };
  let mockDbExecute: sinon.SinonStub;
  let mockAddEvent: sinon.SinonStub;
  let createSentryServiceAccount: (job: PgBoss.Job<any>) => Promise<void>;

  const jobData = {
    email: "john.doe@example.com",
    username: "john.doe",
    userUuid: TEST_USER_UUID,
    requestId: TEST_REQUEST_UUID,
    teams: [{ teamSlug: "my-team", teamRole: "admin" }],
  };

  beforeEach(() => {
    mockSentryClient = {
      getAllUsers: sinon.stub().resolves([]),
      addUserToOrganization: sinon.stub().resolves({ id: "sentry-user-id" }),
      changeMemberRoleInTeam: sinon.stub().resolves(),
    };
    mockDbExecute = sinon.stub().resolves();
    mockAddEvent = sinon.stub().resolves();

    const mockDb = {
      updateTable: sinon.stub().returns({
        set: sinon.stub().returns({
          where: sinon.stub().returns({
            where: sinon.stub().returns({ execute: mockDbExecute }),
          }),
        }),
      }),
    };

    const module = proxyquire("./create-sentry-account", {
      "@/server/config/sentry.config": { sentryClient: mockSentryClient },
      "@/lib/kysely": { db: mockDb },
      "@/lib/events": { addEvent: mockAddEvent },
      "@/lib/sentry": { userAlreadyHaveDefinedRoleOrTeamDoesNotExist: new Error("already has role") },
    });
    createSentryServiceAccount = module.createSentryServiceAccount;
  });

  afterEach(() => sinon.restore());

  it("should create a new sentry user when user does not exist", async () => {
    mockSentryClient.getAllUsers.resolves([]);

    await createSentryServiceAccount(makeJob(jobData));

    expect(mockSentryClient.addUserToOrganization.calledOnce).to.be.true;
    const addArgs = mockSentryClient.addUserToOrganization.firstCall.args[0];
    expect(addArgs.email).to.equal(jobData.email);
    expect(addArgs.orgRole).to.equal("member");
    expect(mockDbExecute.calledOnce).to.be.true;
    expect(mockAddEvent.calledOnce).to.be.true;
  });

  it("should reuse existing sentry user when user already exists", async () => {
    mockSentryClient.getAllUsers.resolves([
      { user: { email: jobData.email }, serviceUserId: "existing-sentry-id" },
    ]);

    await createSentryServiceAccount(makeJob(jobData));

    expect(mockSentryClient.addUserToOrganization.called).to.be.false;
    expect(mockSentryClient.changeMemberRoleInTeam.calledOnce).to.be.true;
    const roleArgs = mockSentryClient.changeMemberRoleInTeam.firstCall.args[0];
    expect(roleArgs.memberId).to.equal("existing-sentry-id");
  });

  it("should update service_accounts table with sentry user ID", async () => {
    mockSentryClient.getAllUsers.resolves([]);

    await createSentryServiceAccount(makeJob(jobData));

    expect(mockDbExecute.calledOnce).to.be.true;
  });

  it("should add event after account creation", async () => {
    await createSentryServiceAccount(makeJob(jobData));

    expect(mockAddEvent.calledOnce).to.be.true;
    const eventArgs = mockAddEvent.firstCall.args[0];
    expect(eventArgs.action_on_username).to.equal(jobData.username);
  });

  it("should not throw when changeMemberRoleInTeam raises userAlreadyHaveDefinedRole error", async () => {
    const specificError = new Error("already has role");
    const module = proxyquire("./create-sentry-account", {
      "@/server/config/sentry.config": { sentryClient: mockSentryClient },
      "@/lib/kysely": {
        db: {
          updateTable: sinon.stub().returns({
            set: sinon.stub().returns({
              where: sinon.stub().returns({
                where: sinon.stub().returns({ execute: mockDbExecute }),
              }),
            }),
          }),
        },
      },
      "@/lib/events": { addEvent: mockAddEvent },
      "@/lib/sentry": { userAlreadyHaveDefinedRoleOrTeamDoesNotExist: specificError },
    });
    mockSentryClient.changeMemberRoleInTeam.rejects(specificError);

    // Should not throw
    await module.createSentryServiceAccount(makeJob(jobData));
  });
});
