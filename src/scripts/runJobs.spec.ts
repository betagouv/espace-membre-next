import { expect } from "chai";
import sinon from "sinon";

import { runJobs } from "./runJobs";

describe("runJobs", () => {
  beforeEach(() => {
    sinon.stub(console, "log");
    sinon.stub(console, "error");
  });

  afterEach(() => {
    sinon.restore();
  });

  it("runs every job in order even when one fails", async () => {
    const calls: string[] = [];
    const error = new Error("boom");
    const onError = sinon.spy();

    const result = await runJobs(
      [
        { name: "first", run: async () => void calls.push("first") },
        {
          name: "second",
          run: async () => {
            calls.push("second");
            throw error;
          },
        },
        { name: "third", run: async () => void calls.push("third") },
      ],
      onError,
    );

    expect(calls).to.deep.equal(["first", "second", "third"]);
    expect(result.failed).to.deep.equal(["second"]);
    expect(onError.calledOnceWithExactly("second", error)).to.be.true;
  });

  it("reports no failure when every job succeeds", async () => {
    const onError = sinon.spy();

    const result = await runJobs(
      [{ name: "only", run: async () => {} }],
      onError,
    );

    expect(result.failed).to.deep.equal([]);
    expect(onError.notCalled).to.be.true;
  });
});
