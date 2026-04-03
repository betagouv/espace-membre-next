import { expect } from "chai";
import sinon from "sinon";
import proxyquire from "proxyquire";

describe("deleteSentryAccountWorker()", () => {
  let mockDeleteSentryAccount: sinon.SinonStub;
  let deleteSentryAccountWorker: () => Promise<void>;

  beforeEach(() => {
    mockDeleteSentryAccount = sinon.stub().resolves();
    const module = proxyquire("./delete-sentry-account", {
      "@/server/schedulers/userContractEndingScheduler": {
        deleteSentryAccount: mockDeleteSentryAccount,
      },
    });
    deleteSentryAccountWorker = module.deleteSentryAccountWorker;
  });

  afterEach(() => sinon.restore());

  it("should call deleteSentryAccount", async () => {
    await deleteSentryAccountWorker();
    expect(mockDeleteSentryAccount.calledOnce).to.be.true;
  });
});
