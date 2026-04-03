import { expect } from "chai";
import sinon from "sinon";
import proxyquire from "proxyquire";
import PgBoss from "pg-boss";

const TEST_STARTUP_UUID = "00000000-0000-0000-0000-000000000001";
const TEST_USER_UUID = "00000000-0000-0000-0000-000000000002";
const TEST_REQUEST_UUID = "00000000-0000-0000-0000-000000000099";

const makeJob = (data: Record<string, any>) =>
  ({ id: "job-1", name: "create-sentry-team", data } as PgBoss.Job<any>);

describe("createSentryTeam()", () => {
  let mockGetStartup: sinon.SinonStub;
  let mockSentryClient: { createSentryTeam: sinon.SinonStub };
  let mockDbExecute: sinon.SinonStub;
  let mockAddEvent: sinon.SinonStub;
  let mockGenerateSentryTeamSlug: sinon.SinonStub;
  let teamAlreadyExistsError: Error;
  let createSentryTeam: (job: PgBoss.Job<any>) => Promise<void>;

  const jobData = {
    startupId: TEST_STARTUP_UUID,
    userUuid: TEST_USER_UUID,
    email: "john.doe@example.com",
    username: "john.doe",
    requestId: TEST_REQUEST_UUID,
  };

  beforeEach(() => {
    mockGetStartup = sinon.stub().resolves({ uuid: TEST_STARTUP_UUID, name: "my-startup" });
    mockSentryClient = { createSentryTeam: sinon.stub().resolves({ id: "sentry-team-id", name: "my-startup" }) };
    mockDbExecute = sinon.stub().resolves();
    mockAddEvent = sinon.stub().resolves();
    mockGenerateSentryTeamSlug = sinon.stub().returns("my-startup");
    teamAlreadyExistsError = new Error("teamAlreadyExists");

    const module = proxyquire("./create-sentry-team", {
      "@/lib/kysely/queries": { getStartup: mockGetStartup },
      "@/server/config/sentry.config": { sentryClient: mockSentryClient },
      "@/lib/kysely": {
        db: {
          insertInto: sinon.stub().returns({
            values: sinon.stub().returns({ execute: mockDbExecute }),
          }),
        },
      },
      "@/lib/events": { addEvent: mockAddEvent },
      "@/lib/sentry": {
        generateSentryTeamSlug: mockGenerateSentryTeamSlug,
        teamAlreadyExistsError,
      },
      "@/utils/error": { NoDataError: class NoDataError extends Error { constructor() { super("NoData"); } } },
    });
    createSentryTeam = module.createSentryTeam;
  });

  afterEach(() => sinon.restore());

  it("should throw NoDataError when startup is not found", async () => {
    mockGetStartup.resolves(null);
    try {
      await createSentryTeam(makeJob(jobData));
      expect.fail("Should have thrown");
    } catch (e: any) {
      expect(e.constructor.name).to.equal("NoDataError");
    }
  });

  it("should create sentry team and insert into sentry_teams table", async () => {
    await createSentryTeam(makeJob(jobData));

    expect(mockSentryClient.createSentryTeam.calledOnce).to.be.true;
    expect(mockDbExecute.calledOnce).to.be.true;
    expect(mockAddEvent.calledOnce).to.be.true;
  });

  it("should not throw when teamAlreadyExistsError is raised", async () => {
    mockSentryClient.createSentryTeam.rejects(teamAlreadyExistsError);

    // Should not throw
    await createSentryTeam(makeJob(jobData));
    expect(mockDbExecute.called).to.be.false;
  });

  it("should rethrow unknown errors", async () => {
    const unknownError = new Error("unexpected");
    mockSentryClient.createSentryTeam.rejects(unknownError);

    try {
      await createSentryTeam(makeJob(jobData));
      expect.fail("Should have thrown");
    } catch (e: any) {
      expect(e.message).to.equal("unexpected");
    }
  });
});
