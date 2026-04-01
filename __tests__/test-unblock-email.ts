import chai from "chai";
import chaiHttp from "chai-http";
import { unblockEmailsThatAreActive } from "@schedulers/unblockEmailsThatAreActive";
import * as EmailConfig from "@/server/config/email.config";
import Sinon from "sinon";
import betagouv from "@betagouv";
import config from "@/server/config";

chai.use(chaiHttp);

describe("Unblock emails", () => {
  let getAllTransacBlockedContactsStub;
  let unblacklistContactEmailStub;
  let getAllContactsFromList;
  beforeEach(() => {
    getAllTransacBlockedContactsStub = Sinon.stub(
      EmailConfig,
      "getAllTransacBlockedContacts",
    );
    getAllTransacBlockedContactsStub.returns(
      Promise.resolve([
        {
          email: `membre.actif@${config.domain}`,
        },
      ]),
    );
    unblacklistContactEmailStub = Sinon.stub(
      EmailConfig,
      "unblacklistContactEmail",
    );

    getAllContactsFromList = Sinon.stub(EmailConfig, "getAllContactsFromList");
    getAllContactsFromList.returns(
      Promise.resolve([
        {
          email: `autremembre.actif@${config.domain}`,
          emailBlacklisted: true,
        },
      ]),
    );
  });
  afterEach(() => {
    getAllTransacBlockedContactsStub.restore();
    unblacklistContactEmailStub.restore();
    getAllContactsFromList.restore();
  });
  it("Should unblock emails that are active", async () => {
    await unblockEmailsThatAreActive();
    unblacklistContactEmailStub.calledTwice.should.be.true;
    unblacklistContactEmailStub.calledWith({
      email: "membre.actif@betagouv.ovh",
    });
  });
});
