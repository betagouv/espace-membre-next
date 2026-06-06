import { expect } from "chai";
import proxyquire from "proxyquire";
import sinon from "sinon";

// Stub heavy/side-effecting imports so the spec can load the module
// without requiring DATABASE_URL / SESSION_SECRET / a real DB connection.
const { assertDestructiveImportAllowed } = proxyquire.noCallThru()(
  "./import-from-www",
  {
    "@/server/config": { default: { domain: "test.local" } },
    "@lib/kysely": { db: {} },
  },
) as typeof import("./import-from-www");

describe("import-from-www destructive guard", () => {
  let warnStub: sinon.SinonStub;

  beforeEach(() => {
    warnStub = sinon.stub(console, "warn");
  });

  afterEach(() => {
    warnStub.restore();
  });

  it("throws when NODE_ENV=production and ALLOW_DESTRUCTIVE_IMPORT is not set", () => {
    expect(() =>
      assertDestructiveImportAllowed({ NODE_ENV: "production" }),
    ).to.throw(/Refused to run import-from-www in production/);
    expect(warnStub.called).to.equal(false);
  });

  it("throws when NODE_ENV=production and ALLOW_DESTRUCTIVE_IMPORT is not exactly 'true'", () => {
    expect(() =>
      assertDestructiveImportAllowed({
        NODE_ENV: "production",
        ALLOW_DESTRUCTIVE_IMPORT: "1",
      }),
    ).to.throw(/Refused to run import-from-www in production/);
    expect(() =>
      assertDestructiveImportAllowed({
        NODE_ENV: "production",
        ALLOW_DESTRUCTIVE_IMPORT: "yes",
      }),
    ).to.throw(/Refused to run import-from-www in production/);
  });

  it("does not throw when NODE_ENV=production and ALLOW_DESTRUCTIVE_IMPORT='true' (with warning)", () => {
    expect(() =>
      assertDestructiveImportAllowed({
        NODE_ENV: "production",
        ALLOW_DESTRUCTIVE_IMPORT: "true",
      }),
    ).to.not.throw();
    expect(warnStub.calledOnce).to.equal(true);
    expect(warnStub.firstCall.args[0]).to.match(
      /ALLOW_DESTRUCTIVE_IMPORT=true detected/,
    );
  });

  it("does not throw in non-production environments", () => {
    expect(() =>
      assertDestructiveImportAllowed({ NODE_ENV: "development" }),
    ).to.not.throw();
    expect(() =>
      assertDestructiveImportAllowed({ NODE_ENV: "test" }),
    ).to.not.throw();
    expect(() => assertDestructiveImportAllowed({})).to.not.throw();
    expect(warnStub.called).to.equal(false);
  });

  it("warns in non-production envs as well when ALLOW_DESTRUCTIVE_IMPORT=true", () => {
    expect(() =>
      assertDestructiveImportAllowed({
        NODE_ENV: "development",
        ALLOW_DESTRUCTIVE_IMPORT: "true",
      }),
    ).to.not.throw();
    expect(warnStub.calledOnce).to.equal(true);
  });
});
