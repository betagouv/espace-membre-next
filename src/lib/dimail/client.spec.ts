import { expect } from "chai";
import sinon from "sinon";
import axios from "axios";

describe("dimail client", () => {
  let axiosGetStub: sinon.SinonStub;
  let postStub: sinon.SinonStub;
  let patchStub: sinon.SinonStub;
  let clientModule: typeof import("./client"); // Declare variable for the module

  const sandbox = sinon.createSandbox();

  beforeEach(() => {
    // Set up environment variables
    process.env.DIMAIL_API_URL = "http://fake-url";
    process.env.DIMAIL_API_USERNAME = "user";
    process.env.DIMAIL_API_PASSWORD = "pass";

    // Stub axios.get for getAccessToken
    axiosGetStub = sandbox
      .stub(axios, "get")
      .resolves({ data: { access_token: "token123" } });

    // Stub axios.create to return a fake instance with post/patch methods
    postStub = sandbox.stub().resolves({
      status: 200,
      data: { email: "test@domain.com", password: "pwd" },
    });
    patchStub = sandbox.stub().resolves({ status: 200, data: {} });

    // Ensure fresh import by clearing require cache
    delete require.cache[require.resolve("./client")];
    clientModule = require("./client");
  });

  afterEach(() => {
    sandbox.restore();
    delete process.env.DIMAIL_API_URL;
    delete process.env.DIMAIL_API_USERNAME;
    delete process.env.DIMAIL_API_PASSWORD;
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
      const result = await clientModule.createMailbox(params);
      expect(postStub.calledOnce).to.be.true;
      expect(postStub.firstCall.args[0]).to.include(
        "/domains/domain.com/mailboxes/user",
      );
      expect(result).to.have.property("email", "test@domain.com");
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
      const result = await clientModule.createAlias(params);
      expect(postStub.calledOnce).to.be.true;
      expect(postStub.firstCall.args[0]).to.include(
        "/domains/domain.com/aliases",
      );
      expect(result).to.have.property("email", "test@domain.com");
      expect(result).to.have.property("password", "pwd");
    });
  });

  describe("resetPassword", () => {
    it("should call axios.post and return success with password", async () => {
      postStub.resolves({ status: 200, data: { password: "newpwd" } });
      const result = await clientModule.resetPassword({
        domain_name: "domain.com",
        user_name: "user",
      });
      expect(postStub.calledOnce).to.be.true;
      expect(result).to.deep.equal({ success: true, password: "newpwd" });
    });

    it("should return success: false if status is not 200", async () => {
      postStub.resolves({ status: 500, data: {} });
      const result = await clientModule.resetPassword({
        domain_name: "domain.com",
        user_name: "user",
      });
      expect(result).to.deep.equal({ success: false });
    });
  });

  describe("patchMailbox", () => {
    it("should call axios.patch and return success", async () => {
      patchStub.resolves({ status: 200, data: {} });
      const result = await clientModule.patchMailbox({
        domain_name: "domain.com",
        user_name: "user",
        data: { active: "yes" },
      });
      expect(patchStub.calledOnce).to.be.true;
      expect(result).to.deep.equal({ success: true });
    });

    it("should return success: false if status is not 200", async () => {
      patchStub.resolves({ status: 500, data: {} });
      const result = await clientModule.patchMailbox({
        domain_name: "domain.com",
        user_name: "user",
        data: { active: "no" },
      });
      expect(result).to.deep.equal({ success: false });
    });
  });

  describe("getAccessToken", () => {
    it("should call axios.get and return access_token", async () => {
      const token = await (clientModule as any).getAccessToken();
      expect(axiosGetStub.calledOnce).to.be.true;
      expect(token).to.equal("token123");
    });
  });
});
