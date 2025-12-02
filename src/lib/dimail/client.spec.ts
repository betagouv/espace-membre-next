import { expect } from "chai";
import sinon from "sinon";
import axios from "axios";
import nock from "nock";

describe("dimail client", () => {
  let axiosGetStub: sinon.SinonStub;
  let clientModule: typeof import("./client"); // Declare variable for the module

  const sandbox = sinon.createSandbox();

  beforeEach(() => {
    // Set up environment variables
    process.env.DIMAIL_API_URL = "http://fake-url";
    process.env.DIMAIL_API_USERNAME = "user";
    process.env.DIMAIL_API_PASSWORD = "pass";

    // Use nock to intercept HTTP calls instead of stubbing axios for those requests
    nock.cleanAll();
    nock.disableNetConnect();

    // Stub axios.get only if client uses axios.get directly for token
    axiosGetStub = sandbox
      .stub(axios, "get")
      .resolves({ data: { access_token: "token123" } });

    // Ensure fresh import by clearing require cache
    delete require.cache[require.resolve("./client")];
    clientModule = require("./client");
  });

  afterEach(() => {
    sandbox.restore();
    delete process.env.DIMAIL_API_URL;
    delete process.env.DIMAIL_API_USERNAME;
    delete process.env.DIMAIL_API_PASSWORD;

    // cleanup nock
    nock.cleanAll();
    nock.enableNetConnect();
  });

  describe("createMailbox", () => {
    it("should call axios.post with correct params and return mailbox result", async () => {
      const params = {
        domain: "domain.com",
        user_name: "user",
        displayName: "User Name",
        givenName: "User",
        surName: "Name",
      };

      // intercept the exact POST to mailbox creation
      const scope = nock(process.env.DIMAIL_API_URL as string)
        .post("/domains/domain.com/mailboxes/user")
        .reply(200, { email: "user@domain.com", password: "pwd" });

      const result = await clientModule.createMailbox(params);

      // validate nock intercepted the request
      expect(scope.isDone()).to.be.true;
      expect(result).to.have.property("email", "user@domain.com");
      expect(result).to.have.property("password", "pwd");
    });
  });

  describe("createAlias", () => {
    it("should call axios.post with correct params and return mailbox result", async () => {
      const params = {
        domain: "domain.com",
        user_name: "user",
        destination: "dest@domain.com",
      };

      // intercept POST to alias creation
      const scope = nock(process.env.DIMAIL_API_URL as string)
        .post("/domains/domain.com/aliases")
        .reply(200, { email: "test@domain.com", password: "pwd" });

      const result = await clientModule.createAlias(params);

      expect(scope.isDone()).to.be.true;
      expect(result).to.have.property("email", "test@domain.com");
      expect(result).to.have.property("password", "pwd");
    });
  });

  describe("resetPassword", () => {
    it("should call axios.post and return success with password", async () => {
      // match any POST under the mailbox path for reset
      const scope = nock(process.env.DIMAIL_API_URL as string)
        .post(new RegExp("/domains/domain.com/mailboxes/user.*"))
        .reply(200, { password: "newpwd" });

      const result = await clientModule.resetPassword({
        domain_name: "domain.com",
        user_name: "user",
      });
      expect(scope.isDone()).to.be.true;
      expect(result).to.deep.equal({ success: true, password: "newpwd" });
    });
  });

  describe("patchMailbox", () => {
    it("should call axios.patch and return success", async () => {
      const scope = nock(process.env.DIMAIL_API_URL as string)
        .patch("/domains/domain.com/mailboxes/user")
        .reply(200, {});

      const result = await clientModule.patchMailbox({
        domain_name: "domain.com",
        user_name: "user",
        data: { active: "yes" },
      });
      expect(scope.isDone()).to.be.true;
      expect(result).to.deep.equal({ success: true });
    });
  });

  describe("getAccessToken", () => {
    it("should call axios.get and return access_token", async () => {
      // either keep using axios.get stub or intercept the GET with nock. Here we verify the axios.get stubed behavior:
      const token = await (clientModule as any).getAccessToken();
      expect(axiosGetStub.calledOnce).to.be.true;
      expect(token).to.equal("token123");
    });
  });
});
