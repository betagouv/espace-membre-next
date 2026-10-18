import { expect } from "chai";
import sinon from "sinon";

import { withRetry } from "@/lib/withRetry";

describe("withRetry", () => {
  beforeEach(() => {
    sinon.stub(console, "error");
  });

  afterEach(() => {
    sinon.restore();
  });

  it("returns the result once an attempt succeeds", async () => {
    const operation = sinon.stub();
    operation.onFirstCall().rejects(new Error("brevo 503"));
    operation.onSecondCall().resolves("sent");

    const result = await withRetry(operation, { baseDelayMs: 0 });

    expect(result).to.equal("sent");
    expect(operation.calledTwice).to.be.true;
  });

  it("throws the last error after retryLimit attempts, capped at 5", async () => {
    const operation = sinon.stub().rejects(new Error("brevo 503"));

    try {
      await withRetry(operation, { retryLimit: 3, baseDelayMs: 0 });
      expect.fail("Should have thrown");
    } catch (e: any) {
      expect(e.message).to.equal("brevo 503");
    }
    expect(operation.callCount).to.equal(3);

    operation.resetHistory();
    await withRetry(operation, { retryLimit: 10, baseDelayMs: 0 }).catch(
      () => {},
    );
    expect(operation.callCount).to.equal(5);
  });
});
