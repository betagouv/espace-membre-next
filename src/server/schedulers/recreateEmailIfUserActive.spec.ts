import { expect } from "chai";
import sinon from "sinon";
import * as Sentry from "@sentry/node";
import * as kyselyQueriesUsers from "@/lib/kysely/queries/users";
import * as kyselyQueriesDimail from "@/lib/kysely/queries/dimail";
import * as dimailClient from "@/lib/dimail/client";
import * as createDimailMailboxWorker from "../queueing/workers/create-dimail-mailbox";
import { db } from "@/lib/kysely";
import { EmailStatusCode } from "@/models/member";
import { recreateEmailIfUserActive } from "./recreateEmailIfUserActive";

describe("recreateEmailIfUserActive", () => {
  let getActiveUsersStub: sinon.SinonStub;
  let getDimailEmailStub: sinon.SinonStub;
  let patchMailboxStub: sinon.SinonStub;
  let createDimailMailboxForUserStub: sinon.SinonStub;
  let dbUpdateTableStub: sinon.SinonStub;
  //let sentryStub: sinon.SinonStub;

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
    createDimailMailboxForUserStub = sinon
      .stub(createDimailMailboxWorker, "createDimailMailboxForUser")
      .resolves();
    dbUpdateTableStub = sinon.stub(db, "updateTable").returns({
      set: sinon.stub().returnsThis(),
      where: sinon.stub().returnsThis(),
      execute: sinon.stub().resolves(),
    } as unknown as any);

    //sentryStub = sinon.stub(Sentry, "captureException");
    sinon.stub(console, "error");
    sinon.stub(console, "log");
  });

  afterEach(() => {
    sinon.restore();
  });

  it("should patch mailbox and update user if email exists in dinum_emails", async () => {
    getDimailEmailStub.resolves(true);

    await recreateEmailIfUserActive();

    expect(patchMailboxStub.calledOnce).to.be.true;
    expect(dbUpdateTableStub.calledOnce).to.be.true;
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

  //   it("should handle errors and capture with Sentry", async () => {
  //     getDimailEmailStub.rejects(new Error("fail"));

  //     await recreateEmailIfUserActive();

  //     expect(sentryStub.calledOnce).to.be.true;
  //   });

  it("should do nothing if no primary_email", async () => {
    (getActiveUsersStub().execute as sinon.SinonStub).resolves([
      { ...fakeUser, primary_email: null },
    ]);
    await recreateEmailIfUserActive();
    expect(patchMailboxStub.notCalled).to.be.true;
    expect(createDimailMailboxForUserStub.notCalled).to.be.true;
  });
});
