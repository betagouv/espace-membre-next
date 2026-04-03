import { expect } from "chai";
import sinon from "sinon";
import proxyquire from "proxyquire";
import PgBoss from "pg-boss";

const TEST_USER_UUID = "00000000-0000-0000-0000-000000000001";

describe("sendNewMemberVerificationEmail()", () => {
  let mockGetUserBasicInfo: sinon.SinonStub;
  let mockHashToken: sinon.SinonStub;
  let mockCreateVerificationToken: sinon.SinonStub;
  let mockSendEmail: sinon.SinonStub;
  let mockAddEvent: sinon.SinonStub;
  let sendNewMemberVerificationEmail: (job: PgBoss.Job<any>) => Promise<void>;

  beforeEach(() => {
    mockGetUserBasicInfo = sinon.stub();
    mockHashToken = sinon.stub().resolves("hashed-token");
    mockCreateVerificationToken = sinon.stub().resolves();
    mockSendEmail = sinon.stub().resolves();
    mockAddEvent = sinon.stub().resolves();

    const module = proxyquire("./send-verification-email", {
      "@/lib/kysely/queries/users": { getUserBasicInfo: mockGetUserBasicInfo },
      "@/utils/auth/hashToken": { hashToken: mockHashToken },
      "@/utils/pgAdpter": { createVerificationToken: mockCreateVerificationToken },
      "@/server/config/email.config": { sendEmail: mockSendEmail },
      "@/lib/events": { addEvent: mockAddEvent },
      "@/server/config": { default: { secret: "test-secret" } },
      "@/utils/url": { getBaseUrl: () => "http://localhost:3000" },
    });
    sendNewMemberVerificationEmail = module.sendNewMemberVerificationEmail;
  });

  afterEach(() => sinon.restore());

  it("should throw when user is not found", async () => {
    mockGetUserBasicInfo.resolves(null);
    try {
      await sendNewMemberVerificationEmail({ data: { userId: TEST_USER_UUID } } as any);
      expect.fail("Should have thrown");
    } catch (e: any) {
      expect(e.message).to.include(TEST_USER_UUID);
    }
  });

  it("should throw when user has no secondary email", async () => {
    mockGetUserBasicInfo.resolves({
      uuid: TEST_USER_UUID,
      username: "john.doe",
      fullname: "John Doe",
      secondary_email: null,
    });
    try {
      await sendNewMemberVerificationEmail({ data: { userId: TEST_USER_UUID } } as any);
      expect.fail("Should have thrown");
    } catch (e: any) {
      expect(e.message).to.include("secondary");
    }
  });

  it("should create verification token and send email when user has secondary email", async () => {
    mockGetUserBasicInfo.resolves({
      uuid: TEST_USER_UUID,
      username: "john.doe",
      fullname: "John Doe",
      secondary_email: "john.doe@example.com",
    });

    await sendNewMemberVerificationEmail({ data: { userId: TEST_USER_UUID } } as any);

    expect(mockHashToken.calledOnce).to.be.true;
    expect(mockCreateVerificationToken.calledOnce).to.be.true;
    expect(mockSendEmail.calledOnce).to.be.true;
    const emailCall = mockSendEmail.firstCall.args[0];
    expect(emailCall.toEmail).to.deep.equal(["john.doe@example.com"]);
    expect(emailCall.type).to.equal("EMAIL_VERIFICATION_WAITING");
    expect(mockAddEvent.calledOnce).to.be.true;
  });
});
