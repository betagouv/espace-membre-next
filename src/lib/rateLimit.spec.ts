import { expect } from "chai";
import sinon from "sinon";

import {
  checkRateLimit,
  __resetRateLimitForTests,
} from "@/lib/rateLimit";

describe("rateLimit", () => {
  let clock: sinon.SinonFakeTimers;

  beforeEach(() => {
    clock = sinon.useFakeTimers(Date.now());
  });

  afterEach(() => {
    __resetRateLimitForTests();
    clock.restore();
  });

  it("allows calls up to the max within the window", () => {
    const key = "login-request:member-a@beta.gouv.fr";
    expect(checkRateLimit(key, 3, 60_000).allowed).to.equal(true);
    expect(checkRateLimit(key, 3, 60_000).allowed).to.equal(true);
    expect(checkRateLimit(key, 3, 60_000).allowed).to.equal(true);
  });

  it("rejects the call once the max is exceeded, with a positive retryAfterSeconds", () => {
    const key = "login-request:member-b@beta.gouv.fr";
    checkRateLimit(key, 3, 60_000);
    checkRateLimit(key, 3, 60_000);
    checkRateLimit(key, 3, 60_000);

    const result = checkRateLimit(key, 3, 60_000);
    expect(result.allowed).to.equal(false);
    expect(result.retryAfterSeconds).to.be.greaterThan(0);
    expect(result.retryAfterSeconds).to.be.at.most(60);
  });

  it("keeps rejecting further calls within the same window", () => {
    const key = "login-request:member-c@beta.gouv.fr";
    for (let i = 0; i < 3; i++) checkRateLimit(key, 3, 60_000);

    expect(checkRateLimit(key, 3, 60_000).allowed).to.equal(false);
    expect(checkRateLimit(key, 3, 60_000).allowed).to.equal(false);
  });

  it("allows calls again once the window has elapsed", () => {
    const key = "login-request:member-d@beta.gouv.fr";
    for (let i = 0; i < 3; i++) checkRateLimit(key, 3, 60_000);
    expect(checkRateLimit(key, 3, 60_000).allowed).to.equal(false);

    clock.tick(60_001);

    expect(checkRateLimit(key, 3, 60_000).allowed).to.equal(true);
  });

  it("tracks independent keys in independent buckets", () => {
    const keyA = "login-request:a@beta.gouv.fr";
    const keyB = "login-request:b@beta.gouv.fr";
    for (let i = 0; i < 3; i++) checkRateLimit(keyA, 3, 60_000);

    expect(checkRateLimit(keyA, 3, 60_000).allowed).to.equal(false);
    expect(checkRateLimit(keyB, 3, 60_000).allowed).to.equal(true);
  });
});
