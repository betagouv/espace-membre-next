import { expect } from "chai";
import sinon from "sinon";
import proxyquire from "proxyquire";

describe("unblockBlacklistedEmails()", () => {
  let mockUnblockEmailsThatAreActive: sinon.SinonStub;
  let unblockBlacklistedEmails: () => Promise<void>;

  beforeEach(() => {
    mockUnblockEmailsThatAreActive = sinon.stub().resolves();
    const module = proxyquire("./unblock-blacklisted-emails", {
      "@/server/schedulers/unblockEmailsThatAreActive": {
        unblockEmailsThatAreActive: mockUnblockEmailsThatAreActive,
      },
    });
    unblockBlacklistedEmails = module.unblockBlacklistedEmails;
  });

  afterEach(() => sinon.restore());

  it("should call unblockEmailsThatAreActive", async () => {
    await unblockBlacklistedEmails();
    expect(mockUnblockEmailsThatAreActive.calledOnce).to.be.true;
  });
});
