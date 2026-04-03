import { expect } from "chai";
import sinon from "sinon";
import proxyquire from "proxyquire";
import PgBoss from "pg-boss";

const TEST_USER_UUID = "00000000-0000-0000-0000-000000000001";
const TEST_REQUEST_UUID = "00000000-0000-0000-0000-000000000099";

const makeJob = (data: Record<string, any>) =>
  ({ id: "job-1", name: "update-sentry-service-account", data } as PgBoss.Job<any>);

describe("updateSentryServiceAccount()", () => {
  let mockSentryClient: {
    fetchUserAccess: sinon.SinonStub;
    addUserToTeam: sinon.SinonStub;
    changeMemberRoleInTeam: sinon.SinonStub;
  };
  let mockDbExecuteTakeFirstOrThrow: sinon.SinonStub;
  let mockAddEvent: sinon.SinonStub;
  let userNotFound: Error;
  let updateSentryServiceAccount: (job: PgBoss.Job<any>) => Promise<void>;

  const jobData = {
    email: "john.doe@example.com",
    username: "john.doe",
    userUuid: TEST_USER_UUID,
    memberId: "sentry-member-id",
    requestId: TEST_REQUEST_UUID,
    teams: [{ teamSlug: "my-team", teamRole: "admin" }],
  };

  beforeEach(() => {
    mockSentryClient = {
      fetchUserAccess: sinon.stub().resolves({ id: "sentry-member-id" }),
      addUserToTeam: sinon.stub().resolves(),
      changeMemberRoleInTeam: sinon.stub().resolves(),
    };
    mockDbExecuteTakeFirstOrThrow = sinon.stub().resolves();
    mockAddEvent = sinon.stub().resolves();
    userNotFound = new Error("userNotFound");

    const module = proxyquire("./update-sentry-account", {
      "@/server/config/sentry.config": { sentryClient: mockSentryClient },
      "@/lib/kysely": {
        db: {
          updateTable: sinon.stub().returns({
            set: sinon.stub().returns({
              where: sinon.stub().returns({
                where: sinon.stub().returns({ executeTakeFirstOrThrow: mockDbExecuteTakeFirstOrThrow }),
              }),
            }),
          }),
        },
      },
      "@/lib/events": { addEvent: mockAddEvent },
      "@/lib/sentry": { userNotFound },
    });
    updateSentryServiceAccount = module.updateSentryServiceAccount;
  });

  afterEach(() => sinon.restore());

  it("should add user to team and change role for each team", async () => {
    await updateSentryServiceAccount(makeJob(jobData));

    expect(mockSentryClient.addUserToTeam.calledOnce).to.be.true;
    expect(mockSentryClient.changeMemberRoleInTeam.calledOnce).to.be.true;
    const addArgs = mockSentryClient.addUserToTeam.firstCall.args[0];
    expect(addArgs.memberId).to.equal(jobData.memberId);
    expect(addArgs.teamSlug).to.equal("my-team");
  });

  it("should update service_accounts table", async () => {
    await updateSentryServiceAccount(makeJob(jobData));

    expect(mockDbExecuteTakeFirstOrThrow.calledOnce).to.be.true;
  });

  it("should add MEMBER_SERVICE_ACCOUNT_UPDATED event on success", async () => {
    await updateSentryServiceAccount(makeJob(jobData));

    expect(mockAddEvent.calledOnce).to.be.true;
    const eventArgs = mockAddEvent.firstCall.args[0];
    expect(eventArgs.action_on_username).to.equal(jobData.username);
  });

  it("should handle userNotFound error and add failure event", async () => {
    mockSentryClient.fetchUserAccess.rejects(userNotFound);

    await updateSentryServiceAccount(makeJob(jobData));

    // Should have logged error event for user not found, not thrown
    expect(mockAddEvent.calledOnce).to.be.true;
    const eventArgs = mockAddEvent.firstCall.args[0];
    expect(eventArgs.action_code).to.include("FAILED");
  });

  it("should rethrow unknown errors", async () => {
    mockSentryClient.fetchUserAccess.rejects(new Error("network error"));

    try {
      await updateSentryServiceAccount(makeJob(jobData));
      expect.fail("Should have thrown");
    } catch (e: any) {
      expect(e.message).to.equal("network error");
    }
  });
});
