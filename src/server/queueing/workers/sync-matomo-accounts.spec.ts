import { expect } from "chai";
import sinon from "sinon";
import proxyquire from "proxyquire";

describe("syncMatomoAccountsWorker()", () => {
  let mockSyncMatomoAccounts: sinon.SinonStub;
  let mockMatomoClient: object;
  let syncMatomoAccountsWorker: () => Promise<void>;

  beforeEach(() => {
    mockSyncMatomoAccounts = sinon.stub().resolves();
    mockMatomoClient = {};
    const module = proxyquire("./sync-matomo-accounts", {
      "@/server/schedulers/serviceScheduler/syncMatomoAccounts": {
        syncMatomoAccounts: mockSyncMatomoAccounts,
      },
      "@/server/config/matomo.config": { matomoClient: mockMatomoClient },
    });
    syncMatomoAccountsWorker = module.syncMatomoAccountsWorker;
  });

  afterEach(() => sinon.restore());

  it("should call syncMatomoAccounts with matomoClient", async () => {
    await syncMatomoAccountsWorker();
    expect(mockSyncMatomoAccounts.calledOnce).to.be.true;
    expect(mockSyncMatomoAccounts.firstCall.args[0]).to.equal(mockMatomoClient);
  });
});
