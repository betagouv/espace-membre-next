import { expect } from "chai";
import sinon from "sinon";
import proxyquire from "proxyquire";
import PgBoss from "pg-boss";

const TEST_USER_UUID = "00000000-0000-0000-0000-000000000001";
const TEST_INCUBATOR_UUID = "00000000-0000-0000-0000-000000000002";

const makeJob = (data: Record<string, any>) => ({ data } as PgBoss.Job<any>);

describe("sendNewMemberValidationEmail()", () => {
  let mockGetMemberIfValidOrThrowError: sinon.SinonStub;
  let mockGetUserStartups: sinon.SinonStub;
  let mockGetIncubator: sinon.SinonStub;
  let mockGetIncubatorTeamMembers: sinon.SinonStub;
  let mockSendEmail: sinon.SinonStub;
  let mockIncubatorToModel: sinon.SinonStub;
  let mockUserStartupToModel: sinon.SinonStub;
  let sendNewMemberValidationEmail: (job: PgBoss.Job<any>) => Promise<void>;

  const memberModel = { uuid: TEST_USER_UUID, username: "john.doe", fullname: "John Doe" };
  const incubatorModel = { uuid: TEST_INCUBATOR_UUID, title: "Incubateur Test" };
  const teamMember = { primary_email: "team@example.com" };
  const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

  beforeEach(() => {
    mockGetMemberIfValidOrThrowError = sinon.stub().resolves(memberModel);
    mockGetUserStartups = sinon.stub().resolves([{ incubator_id: TEST_INCUBATOR_UUID, end: futureDate }]);
    mockGetIncubator = sinon.stub().resolves(incubatorModel);
    mockGetIncubatorTeamMembers = sinon.stub().resolves([teamMember]);
    mockSendEmail = sinon.stub().resolves();
    mockIncubatorToModel = sinon.stub().returns(incubatorModel);
    mockUserStartupToModel = sinon.stub().callsFake((s) => s);

    const module = proxyquire("./send-validation-email", {
      "./utils": { getMemberIfValidOrThrowError: mockGetMemberIfValidOrThrowError },
      "@/lib/kysely/queries/users": { getUserBasicInfo: sinon.stub(), getUserStartups: mockGetUserStartups },
      "@/lib/kysely/queries/incubators": { getIncubator: mockGetIncubator },
      "@/lib/kysely/queries/teams": { getIncubatorTeamMembers: mockGetIncubatorTeamMembers },
      "@/server/config/email.config": { sendEmail: mockSendEmail },
      "@/models/mapper": { incubatorToModel: mockIncubatorToModel, userStartupToModel: mockUserStartupToModel },
      "@/server/config": { default: { protocol: "https", host: "espace-membre.beta.gouv.fr" } },
    });
    sendNewMemberValidationEmail = module.sendNewMemberValidationEmail;
  });

  afterEach(() => sinon.restore());

  it("should send validation email to incubator team members", async () => {
    await sendNewMemberValidationEmail(
      makeJob({ userId: TEST_USER_UUID, incubator_id: TEST_INCUBATOR_UUID }),
    );

    expect(mockGetMemberIfValidOrThrowError.calledOnceWith(TEST_USER_UUID)).to.be.true;
    expect(mockGetIncubator.calledOnceWith(TEST_INCUBATOR_UUID)).to.be.true;
    expect(mockGetIncubatorTeamMembers.calledOnce).to.be.true;
    expect(mockSendEmail.calledOnce).to.be.true;
    const emailArgs = mockSendEmail.firstCall.args[0];
    expect(emailArgs.toEmail).to.deep.equal(["team@example.com"]);
    expect(emailArgs.type).to.equal("EMAIL_NEW_MEMBER_VALIDATION");
  });

  it("should throw BusinessError when no incubator IDs found", async () => {
    mockGetUserStartups.resolves([]);
    try {
      await sendNewMemberValidationEmail(makeJob({ userId: TEST_USER_UUID }));
      expect.fail("Should have thrown");
    } catch (e: any) {
      expect(e.constructor.name).to.equal("BusinessError");
      expect(e.message).to.include("not linked to any incubators");
    }
  });

  it("should throw BusinessError when incubator does not exist", async () => {
    mockGetIncubator.resolves(null);
    try {
      await sendNewMemberValidationEmail(
        makeJob({ userId: TEST_USER_UUID, incubator_id: TEST_INCUBATOR_UUID }),
      );
      expect.fail("Should have thrown");
    } catch (e: any) {
      expect(e.constructor.name).to.equal("BusinessError");
      expect(e.message).to.include("does not exist");
    }
  });

  it("should throw BusinessError when incubator has no team members", async () => {
    mockGetIncubatorTeamMembers.resolves([]);
    try {
      await sendNewMemberValidationEmail(
        makeJob({ userId: TEST_USER_UUID, incubator_id: TEST_INCUBATOR_UUID }),
      );
      expect.fail("Should have thrown");
    } catch (e: any) {
      expect(e.constructor.name).to.equal("BusinessError");
      expect(e.message).to.include("no member in animation teams");
    }
  });

  it("should deduplicate incubator IDs from job data and startups", async () => {
    // Both startup and job data have the same incubator_id
    mockGetUserStartups.resolves([{ incubator_id: TEST_INCUBATOR_UUID, end: futureDate }]);
    await sendNewMemberValidationEmail(
      makeJob({ userId: TEST_USER_UUID, incubator_id: TEST_INCUBATOR_UUID }),
    );
    // Should only send one email (deduplication)
    expect(mockSendEmail.calledOnce).to.be.true;
  });

  it("should exclude startups with past end dates", async () => {
    const pastDate = new Date(Date.now() - 1000);
    mockGetUserStartups.resolves([{ incubator_id: TEST_INCUBATOR_UUID, end: pastDate }]);
    // No valid startup incubator, but job provides one
    await sendNewMemberValidationEmail(
      makeJob({ userId: TEST_USER_UUID, incubator_id: TEST_INCUBATOR_UUID }),
    );
    expect(mockSendEmail.calledOnce).to.be.true;
  });
});
