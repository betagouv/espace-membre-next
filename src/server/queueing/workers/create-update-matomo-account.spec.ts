import { expect } from "chai";
import sinon from "sinon";
import proxyquire from "proxyquire";
import PgBoss from "pg-boss";

const TEST_USER_UUID = "00000000-0000-0000-0000-000000000001";
const TEST_REQUEST_UUID = "00000000-0000-0000-0000-000000000099";

const makeJob = (data: Record<string, any>) =>
  ({ id: "job-1", name: "create-update-matomo-service-account", data } as PgBoss.Job<any>);

describe("createOrUpdateMatomoServiceAccount()", () => {
  let mockGetUserBasicInfo: sinon.SinonStub;
  let mockMatomoClient: {
    getUserByEmail: sinon.SinonStub;
    createUser: sinon.SinonStub;
    grantUserAccess: sinon.SinonStub;
    getAllSites: sinon.SinonStub;
    fetchUserAccess: sinon.SinonStub;
    getSiteOrCreate: sinon.SinonStub;
  };
  let mockDbUpdate: sinon.SinonStub;
  let mockDbInsert: sinon.SinonStub;
  let mockSendEmail: sinon.SinonStub;
  let mockAddEvent: sinon.SinonStub;
  let mockMatomoMetadataToModel: sinon.SinonStub;
  let mockDecryptPassword: sinon.SinonStub;
  let createOrUpdateMatomoServiceAccount: (job: PgBoss.Job<any>) => Promise<void>;

  const jobData = {
    email: "john.doe@example.com",
    login: "john.doe",
    password: "encrypted-password",
    username: "john.doe",
    userUuid: TEST_USER_UUID,
    requestId: TEST_REQUEST_UUID,
    sites: [{ id: 1 }],
  };

  beforeEach(() => {
    mockGetUserBasicInfo = sinon.stub().resolves({
      uuid: TEST_USER_UUID,
      username: "john.doe",
      fullname: "John Doe",
      primary_email: "john.doe@beta.gouv.fr",
    });
    mockMatomoClient = {
      getUserByEmail: sinon.stub().resolves({ result: "error", message: "est inexistant." }),
      createUser: sinon.stub().resolves(),
      grantUserAccess: sinon.stub().resolves(),
      getAllSites: sinon.stub().resolves([]),
      fetchUserAccess: sinon.stub().resolves([]),
      getSiteOrCreate: sinon.stub().resolves(42),
    };
    mockDbUpdate = sinon.stub().resolves({ numUpdatedRows: 1n });
    mockDbInsert = sinon.stub().resolves();
    mockSendEmail = sinon.stub().resolves();
    mockAddEvent = sinon.stub().resolves();
    mockMatomoMetadataToModel = sinon.stub().returns({ sites: [] });
    mockDecryptPassword = sinon.stub().returns("decrypted-password");

    const module = proxyquire("./create-update-matomo-account", {
      "@/lib/kysely/queries/users": { getUserBasicInfo: mockGetUserBasicInfo },
      "@/server/config/matomo.config": { matomoClient: mockMatomoClient },
      "@/lib/kysely": {
        db: {
          updateTable: sinon.stub().returns({
            where: sinon.stub().returns({
              where: sinon.stub().returns({
                set: sinon.stub().returns({ executeTakeFirstOrThrow: mockDbUpdate }),
              }),
            }),
          }),
          insertInto: sinon.stub().returns({
            values: sinon.stub().returns({ execute: mockDbInsert }),
          }),
        },
      },
      "@/server/config/email.config": { sendEmail: mockSendEmail },
      "@/lib/events": { addEvent: mockAddEvent },
      "@/models/mapper/matomoMapper": { matomoMetadataToModel: mockMatomoMetadataToModel },
      "@/server/controllers/utils": { decryptPassword: mockDecryptPassword },
      "@/utils/error": {
        BusinessError: class BusinessError extends Error {
          constructor(code: string, msg: string) {
            super(msg);
            this.name = "BusinessError";
          }
        },
      },
    });
    createOrUpdateMatomoServiceAccount = module.createOrUpdateMatomoServiceAccount;
  });

  afterEach(() => sinon.restore());

  it("should throw BusinessError when user is not found", async () => {
    mockGetUserBasicInfo.resolves(null);
    try {
      await createOrUpdateMatomoServiceAccount(makeJob(jobData));
      expect.fail("Should have thrown");
    } catch (e: any) {
      expect(e.name).to.equal("BusinessError");
    }
  });

  it("should create matomo user when user does not exist", async () => {
    mockMatomoClient.getUserByEmail.resolves({ result: "error", message: "est inexistant." });

    await createOrUpdateMatomoServiceAccount(makeJob(jobData));

    expect(mockMatomoClient.createUser.calledOnce).to.be.true;
    const createArgs = mockMatomoClient.createUser.firstCall.args[0];
    expect(createArgs.email).to.equal(jobData.email);
    expect(createArgs.password).to.equal("decrypted-password");
  });

  it("should not create user when matomo user already exists", async () => {
    mockMatomoClient.getUserByEmail.resolves({ login: "john.doe" });

    await createOrUpdateMatomoServiceAccount(makeJob(jobData));

    expect(mockMatomoClient.createUser.called).to.be.false;
  });

  it("should grant user access to sites", async () => {
    await createOrUpdateMatomoServiceAccount(makeJob(jobData));

    expect(mockMatomoClient.grantUserAccess.calledOnce).to.be.true;
  });

  it("should send EMAIL_MATOMO_ACCOUNT_CREATED for new user", async () => {
    mockMatomoClient.getUserByEmail.resolves({ result: "error", message: "est inexistant." });

    await createOrUpdateMatomoServiceAccount(makeJob(jobData));

    expect(mockSendEmail.calledOnce).to.be.true;
    expect(mockSendEmail.firstCall.args[0].type).to.equal("EMAIL_MATOMO_ACCOUNT_CREATED");
  });

  it("should send EMAIL_MATOMO_ACCOUNT_UPDATED for existing user", async () => {
    mockMatomoClient.getUserByEmail.resolves({ login: "john.doe" });

    await createOrUpdateMatomoServiceAccount(makeJob(jobData));

    expect(mockSendEmail.calledOnce).to.be.true;
    expect(mockSendEmail.firstCall.args[0].type).to.equal("EMAIL_MATOMO_ACCOUNT_UPDATED");
  });

  it("should create new matomo site when newSite is provided", async () => {
    const jobDataWithNewSite = {
      ...jobData,
      newSite: { url: "https://mysite.fr", name: "My Site", type: "website", startupId: "startup-1" },
    };

    await createOrUpdateMatomoServiceAccount(makeJob(jobDataWithNewSite));

    expect(mockMatomoClient.getSiteOrCreate.calledOnce).to.be.true;
  });
});
