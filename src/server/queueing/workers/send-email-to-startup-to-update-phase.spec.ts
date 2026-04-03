import { expect } from "chai";
import sinon from "sinon";
import proxyquire from "proxyquire";

describe("sendEmailToStartupToUpdatePhaseWorker()", () => {
  let mockSendEmailToStartupToUpdatePhase: sinon.SinonStub;
  let sendEmailToStartupToUpdatePhaseWorker: () => Promise<void>;

  beforeEach(() => {
    mockSendEmailToStartupToUpdatePhase = sinon.stub().resolves();
    const module = proxyquire("./send-email-to-startup-to-update-phase", {
      "@/server/schedulers/startups/sendEmailToStartupToUpdatePhase": {
        sendEmailToStartupToUpdatePhase: mockSendEmailToStartupToUpdatePhase,
      },
    });
    sendEmailToStartupToUpdatePhaseWorker = module.sendEmailToStartupToUpdatePhaseWorker;
  });

  afterEach(() => sinon.restore());

  it("should call sendEmailToStartupToUpdatePhase", async () => {
    await sendEmailToStartupToUpdatePhaseWorker();
    expect(mockSendEmailToStartupToUpdatePhase.calledOnce).to.be.true;
  });
});
