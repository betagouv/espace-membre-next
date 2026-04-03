import { expect } from "chai";
import sinon from "sinon";
import proxyquire from "proxyquire";

describe("recreateEmailIfUserActiveWorker()", () => {
  let mockRecreateEmailIfUserActive: sinon.SinonStub;
  let recreateEmailIfUserActiveWorker: () => Promise<void>;

  beforeEach(() => {
    mockRecreateEmailIfUserActive = sinon.stub().resolves();
    const module = proxyquire("./recreate-email-if-user-active", {
      "@/server/schedulers/recreateEmailIfUserActive": {
        recreateEmailIfUserActive: mockRecreateEmailIfUserActive,
      },
    });
    recreateEmailIfUserActiveWorker = module.recreateEmailIfUserActiveWorker;
  });

  afterEach(() => sinon.restore());

  it("should call recreateEmailIfUserActive", async () => {
    await recreateEmailIfUserActiveWorker();
    expect(mockRecreateEmailIfUserActive.calledOnce).to.be.true;
  });
});
