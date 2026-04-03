import { expect } from "chai";
import sinon from "sinon";
import proxyquire from "proxyquire";

describe("syncSentryAccountsWorker()", () => {
  let mockSyncSentryAccounts: sinon.SinonStub;
  let mockSentryClient: object;
  let syncSentryAccountsWorker: () => Promise<void>;

  beforeEach(() => {
    mockSyncSentryAccounts = sinon.stub().resolves();
    mockSentryClient = {};
    const module = proxyquire("./sync-sentry-accounts", {
      "@/server/schedulers/serviceScheduler/syncSentryAccounts": {
        syncSentryAccounts: mockSyncSentryAccounts,
      },
      "@/server/config/sentry.config": { sentryClient: mockSentryClient },
    });
    syncSentryAccountsWorker = module.syncSentryAccountsWorker;
  });

  afterEach(() => sinon.restore());

  it("should call syncSentryAccounts with sentryClient", async () => {
    await syncSentryAccountsWorker();
    expect(mockSyncSentryAccounts.calledOnce).to.be.true;
    expect(mockSyncSentryAccounts.firstCall.args[0]).to.equal(mockSentryClient);
  });
});
