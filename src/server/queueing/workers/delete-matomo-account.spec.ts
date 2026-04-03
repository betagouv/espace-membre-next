import { expect } from "chai";
import sinon from "sinon";
import proxyquire from "proxyquire";

describe("deleteMatomoAccountWorker()", () => {
  let mockDeleteMatomoAccount: sinon.SinonStub;
  let deleteMatomoAccountWorker: () => Promise<void>;

  beforeEach(() => {
    mockDeleteMatomoAccount = sinon.stub().resolves();
    const module = proxyquire("./delete-matomo-account", {
      "@/server/schedulers/userContractEndingScheduler": {
        deleteMatomoAccount: mockDeleteMatomoAccount,
      },
    });
    deleteMatomoAccountWorker = module.deleteMatomoAccountWorker;
  });

  afterEach(() => sinon.restore());

  it("should call deleteMatomoAccount", async () => {
    await deleteMatomoAccountWorker();
    expect(mockDeleteMatomoAccount.calledOnce).to.be.true;
  });
});
