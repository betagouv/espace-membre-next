import { expect } from "chai";
import sinon from "sinon";
import * as kyselyQueriesUsers from "@/lib/kysely/queries/users";
import * as kyselyQueriesDimail from "@/lib/kysely/queries/dimail";
import * as dimailClient from "@/lib/dimail/client";
import rewire from "rewire";
import { EmailStatusCode } from "@/models/member";
import { db } from "@/lib/kysely";
// load module via rewire so we can override its internal binding
const recreateModule = rewire("./recreateEmailIfUserActive");
const recreateEmailIfUserActive = recreateModule.__get__(
  "recreateEmailIfUserActive",
);

describe("recreateEmailIfUserActive", () => {
  let getActiveUsersStub: sinon.SinonStub;
  let getDimailEmailStub: sinon.SinonStub;
  let patchMailboxStub: sinon.SinonStub;
  let createDimailMailboxForUserStub: sinon.SinonStub;
  let dbUpdateTableStub: sinon.SinonStub;

  const fakeUser = {
    uuid: "user-uuid",
    username: "testuser",
    primary_email: "test@beta.gouv.fr",
    secondary_email: "test2@beta.gouv.fr",
    primary_email_status: EmailStatusCode.EMAIL_SUSPENDED,
  };

  beforeEach(() => {
    getActiveUsersStub = sinon
      .stub(kyselyQueriesUsers, "getActiveUsers")
      .returns({
        where: sinon.stub().returnsThis(),
        execute: sinon.stub().resolves([fakeUser]),
      } as any);

    getDimailEmailStub = sinon.stub(kyselyQueriesDimail, "getDimailEmail");
    patchMailboxStub = sinon.stub(dimailClient, "patchMailbox").resolves();
    // create a stub and inject it into the module under test
    createDimailMailboxForUserStub = sinon.stub().resolves();
    recreateModule.__set__(
      "createDimailMailboxForUser",
      createDimailMailboxForUserStub,
    );
    dbUpdateTableStub = sinon.stub(db, "updateTable").returns({
      set: sinon.stub().returnsThis(),
      where: sinon.stub().returnsThis(),
      execute: sinon.stub().resolves(),
    });

    //sinon.stub(console, "error");
    //sinon.stub(console, "log");
  });

  afterEach(() => {
    sinon.restore();
  });

  it("should patch mailbox and update user if email exists in dinum_emails", async () => {
    getDimailEmailStub.resolves(true);

    await recreateEmailIfUserActive();

    // expect(patchMailboxStub.calledOnce).to.be.true;
    // expect(patchMailboxStub.firstCall.args[0]).to.deep.eq({
    //   data: {
    //     active: "yes",
    //   },
    //   domain_name: "test-opi-email.beta.gouv.fr",
    //   user_name: "test",
    // });
    expect(dbUpdateTableStub.calledOnce).to.be.true;
    expect(dbUpdateTableStub.firstCall.args[0]).to.deep.eq("users");
    expect(createDimailMailboxForUserStub.notCalled).to.be.true;
  });

  it("should create mailbox if email does not exist in dinum_emails", async () => {
    getDimailEmailStub.resolves(false);

    await recreateEmailIfUserActive();

    expect(patchMailboxStub.notCalled).to.be.true;
    expect(dbUpdateTableStub.notCalled).to.be.true;
    expect(createDimailMailboxForUserStub.calledOnceWith(fakeUser.uuid)).to.be
      .true;
  });

  it("should do nothing if no primary_email", async () => {
    (getActiveUsersStub().execute as sinon.SinonStub).resolves([
      { ...fakeUser, primary_email: null },
    ]);
    await recreateEmailIfUserActive();
    expect(patchMailboxStub.notCalled).to.be.true;
    expect(createDimailMailboxForUserStub.notCalled).to.be.true;
  });
});
