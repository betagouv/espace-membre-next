import { expect } from "chai";
import nock from "nock";
import sinon from "sinon";
import axios from "axios";
import crypto from "crypto";
import proxyquire from "proxyquire";

const IDENTITY_URL = "https://matrix.example.com";
const PEPPER = "test-pepper";

function hashEmail(email: string, pepper: string): string {
  const input = `${email.toLowerCase()} email ${pepper}`;
  return crypto
    .createHash("sha256")
    .update(input)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

describe("lookupMatrixIdsByEmails", () => {
  let mockConfig: {
    matrix_identity_url: string | undefined;
    matrix_token: string | undefined;
    matrix_user_id: string | undefined;
  };
  let lookupMatrixIdsByEmails: (
    emails: string[],
  ) => Promise<Map<string, string>>;

  beforeEach(() => {
    mockConfig = {
      matrix_identity_url: IDENTITY_URL,
      matrix_token: undefined,
      matrix_user_id: undefined,
    };
    const mod = proxyquire("./client", {
      "@/server/config": {
        default: mockConfig,
        __esModule: true,
        "@noCallThru": true,
      },
    });
    lookupMatrixIdsByEmails = mod.lookupMatrixIdsByEmails;
    nock.cleanAll();
    nock.disableNetConnect();
  });

  afterEach(() => {
    sinon.restore();
    nock.cleanAll();
    nock.enableNetConnect();
  });

  it("returns empty Map when MATRIX_IDENTITY_URL is not set", async () => {
    mockConfig.matrix_identity_url = undefined;
    const result = await lookupMatrixIdsByEmails(["user@gouv.fr"]);
    expect(result.size).to.equal(0);
  });

  it("returns empty Map when emails list is empty", async () => {
    const result = await lookupMatrixIdsByEmails([]);
    expect(result.size).to.equal(0);
  });

  it("fetches pepper then posts hashed addresses and returns email→matrix_id map", async () => {
    const email = "agent@ministry.gouv.fr";
    const hash = hashEmail(email, PEPPER);
    const matrixId = "@agent:ministry.tchap.gouv.fr";

    nock(IDENTITY_URL)
      .get("/_matrix/identity/v2/hash_details")
      .reply(200, { lookup_pepper: PEPPER, algorithms: ["sha256"] });

    nock(IDENTITY_URL)
      .post("/_matrix/identity/v2/lookup")
      .reply(200, { mappings: { [hash]: matrixId } });

    const result = await lookupMatrixIdsByEmails([email]);

    expect(result.size).to.equal(1);
    expect(result.get(email)).to.equal(matrixId);
  });

  it("sends correct algorithm, pepper and hashed addresses in POST body", async () => {
    const email = "agent@ministry.gouv.fr";
    const hash = hashEmail(email, PEPPER);
    const axiosPostStub = sinon
      .stub(axios, "post")
      .resolves({ data: { mappings: {} } });

    nock(IDENTITY_URL)
      .get("/_matrix/identity/v2/hash_details")
      .reply(200, { lookup_pepper: PEPPER, algorithms: ["sha256"] });

    await lookupMatrixIdsByEmails([email]);

    const [, body] = axiosPostStub.firstCall.args;
    expect(body).to.deep.equal({
      algorithm: "sha256",
      pepper: PEPPER,
      addresses: [hash],
    });
  });

  it("fetches identity token via openid/request_token + account/register and uses it for hash_details and lookup", async () => {
    const MATRIX_USER = "@bot:example.com";
    const HOME_TOKEN = "homeserver-access-token";
    const IDENTITY_TOKEN = "derived-identity-token";

    mockConfig.matrix_token = HOME_TOKEN;
    mockConfig.matrix_user_id = MATRIX_USER;
    const mod = proxyquire("./client", {
      "@/server/config": {
        default: mockConfig,
        __esModule: true,
        "@noCallThru": true,
      },
    });
    lookupMatrixIdsByEmails = mod.lookupMatrixIdsByEmails;

    const email = "agent@gouv.fr";
    const hash = hashEmail(email, PEPPER);
    const openidPayload = {
      access_token: "openid-access-token",
      expires_in: 3600,
      matrix_server_name: "example.com",
      token_type: "Bearer",
    };

    nock(IDENTITY_URL, {
      reqheaders: { authorization: `Bearer ${HOME_TOKEN}` },
    })
      .post(
        `/_matrix/client/v3/user/${encodeURIComponent(MATRIX_USER)}/openid/request_token`,
        {},
      )
      .reply(200, openidPayload);

    nock(IDENTITY_URL)
      .post("/_matrix/identity/v2/account/register", openidPayload)
      .reply(200, { access_token: IDENTITY_TOKEN });

    nock(IDENTITY_URL, {
      reqheaders: { authorization: `Bearer ${IDENTITY_TOKEN}` },
    })
      .get("/_matrix/identity/v2/hash_details")
      .reply(200, { lookup_pepper: PEPPER, algorithms: ["sha256"] });

    nock(IDENTITY_URL, {
      reqheaders: { authorization: `Bearer ${IDENTITY_TOKEN}` },
    })
      .post("/_matrix/identity/v2/lookup")
      .reply(200, { mappings: { [hash]: "@agent:tchap.gouv.fr" } });

    const result = await lookupMatrixIdsByEmails([email]);
    expect(result.get(email)).to.equal("@agent:tchap.gouv.fr");
  });

  it("returns empty Map when identity server has no mappings for the emails", async () => {
    nock(IDENTITY_URL)
      .get("/_matrix/identity/v2/hash_details")
      .reply(200, { lookup_pepper: PEPPER, algorithms: ["sha256"] });

    nock(IDENTITY_URL)
      .post("/_matrix/identity/v2/lookup")
      .reply(200, { mappings: {} });

    const result = await lookupMatrixIdsByEmails(["unknown@contractor.com"]);
    expect(result.size).to.equal(0);
  });

  it("sends multiple batches when emails exceed batch size", async () => {
    const emails = Array.from({ length: 55 }, (_, i) => `user${i}@gouv.fr`);

    nock(IDENTITY_URL)
      .get("/_matrix/identity/v2/hash_details")
      .reply(200, { lookup_pepper: PEPPER, algorithms: ["sha256"] });

    // first batch of 50
    nock(IDENTITY_URL)
      .post("/_matrix/identity/v2/lookup")
      .reply(200, { mappings: {} });

    // second batch of 5
    nock(IDENTITY_URL)
      .post("/_matrix/identity/v2/lookup")
      .reply(200, { mappings: {} });

    await lookupMatrixIdsByEmails(emails);

    expect(nock.isDone()).to.be.true;
  });
});
