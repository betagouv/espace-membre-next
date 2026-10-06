import { expect } from "chai";
import sinon from "sinon";

import * as findUsersLib from "@/lib/auth/findUsersByLoginEmail";
import {
  authorizeFakeProConnect,
  isFakeProConnectEnabled,
} from "@/lib/auth/fakeProConnect";

describe("fake ProConnect login (development only)", () => {
  const env = process.env as Record<string, string | undefined>;
  const initialNodeEnv = env.NODE_ENV;
  const initialFlag = env.FAKE_PROCONNECT_LOGIN;
  let findUsersStub: sinon.SinonStub;

  beforeEach(() => {
    findUsersStub = sinon.stub(findUsersLib, "findUsersByLoginEmail");
    delete env.FAKE_PROCONNECT_LOGIN;
  });

  afterEach(() => {
    sinon.restore();
    env.NODE_ENV = initialNodeEnv;
    if (initialFlag === undefined) {
      delete env.FAKE_PROCONNECT_LOGIN;
    } else {
      env.FAKE_PROCONNECT_LOGIN = initialFlag;
    }
  });

  describe("isFakeProConnectEnabled", () => {
    it("is enabled under NODE_ENV=development", () => {
      env.NODE_ENV = "development";
      expect(isFakeProConnectEnabled()).to.be.true;
    });

    it("can be disabled locally with FAKE_PROCONNECT_LOGIN=false", () => {
      env.NODE_ENV = "development";
      env.FAKE_PROCONNECT_LOGIN = "false";
      expect(isFakeProConnectEnabled()).to.be.false;
    });

    it("is never enabled in production, even with the flag set", () => {
      env.NODE_ENV = "production";
      env.FAKE_PROCONNECT_LOGIN = "true";
      expect(isFakeProConnectEnabled()).to.be.false;
    });

    it("is not enabled in test", () => {
      env.NODE_ENV = "test";
      env.FAKE_PROCONNECT_LOGIN = "true";
      expect(isFakeProConnectEnabled()).to.be.false;
    });
  });

  describe("authorizeFakeProConnect", () => {
    it("refuses to log anyone in when it is not enabled", async () => {
      env.NODE_ENV = "production";
      try {
        await authorizeFakeProConnect({ email: "ada@beta.gouv.fr" });
        expect.fail("Should have thrown");
      } catch (e: any) {
        expect(e.message).to.equal("FakeProConnectDisabled");
      }
      expect(findUsersStub.called).to.be.false;
    });

    it("logs in the single member matching the email, like ProConnect", async () => {
      env.NODE_ENV = "development";
      findUsersStub.resolves([
        { username: "ada.lovelace", uuid: "uuid-1", fullname: "Ada Lovelace" },
      ] as any);

      const user = await authorizeFakeProConnect({
        email: " Ada.Lovelace@beta.gouv.fr ",
      });

      expect(findUsersStub.calledOnceWith("ada.lovelace@beta.gouv.fr")).to.be
        .true;
      expect(user).to.deep.equal({
        id: "ada.lovelace",
        uuid: "uuid-1",
        name: "Ada Lovelace",
        email: "ada.lovelace@beta.gouv.fr",
      });
    });

    it("refuses an email matching no member", async () => {
      env.NODE_ENV = "development";
      findUsersStub.resolves([]);
      try {
        await authorizeFakeProConnect({ email: "nobody@beta.gouv.fr" });
        expect.fail("Should have thrown");
      } catch (e: any) {
        expect(e.message).to.equal("UnknownMember");
      }
    });

    it("refuses an email matching several members", async () => {
      env.NODE_ENV = "development";
      findUsersStub.resolves([{ username: "a" }, { username: "b" }] as any);
      try {
        await authorizeFakeProConnect({ email: "shared@beta.gouv.fr" });
        expect.fail("Should have thrown");
      } catch (e: any) {
        expect(e.message).to.equal("UnknownMember");
      }
    });
  });
});
