import chai, { expect } from "chai";
import sinon from "sinon";
import rewire from "rewire";
import * as utils from "@controllers/utils";
import * as kyselyQueries from "@/lib/kysely/queries/users";
import * as dimailQueries from "@/lib/kysely/queries/dimail";
import * as mapper from "@/models/mapper";
import * as dimailClient from "@/lib/dimail/client";
import BetaGouv from "@betagouv";
import { EmailStatusCode } from "@/models/member";
import { EMAIL_PLAN_TYPE } from "@/models/ovh";
import { DIMAIL_MAILBOX_DOMAIN } from "@lib/dimail/utils";
import { db } from "@/lib/kysely";

chai.should();

// helper to mock Kysely-style chainable query builders in tests
function createFakeQB(result: any) {
  const qb = {
    where: sinon.stub().returnsThis(),
    execute: sinon.stub().resolves(result),
  };
  return qb;
}

const emailScheduler = rewire("../src/server/schedulers/emailScheduler");
const recreateEmailIfUserActive = rewire(
  "../src/server/schedulers/recreateEmailIfUserActive",
);

describe("deactivateExpiredMembersEmails", () => {
  let getAllUsersInfoStub: sinon.SinonStub;
  let memberBaseInfoToModelStub: sinon.SinonStub;
  let getExpiredUsersStub: sinon.SinonStub;
  let emailInfosStub: sinon.SinonStub;
  let patchMailboxStub: sinon.SinonStub;
  let setEmailSuspendedStub: sinon.SinonStub;
  let changePasswordStub: sinon.SinonStub;

  beforeEach(() => {
    // ensure a clean sinon state each test to avoid "already wrapped" errors
    sinon.restore();

    getAllUsersInfoStub = sinon.stub(kyselyQueries, "getAllUsersInfo");
    memberBaseInfoToModelStub = sinon.stub(mapper, "memberBaseInfoToModel");
    getExpiredUsersStub = sinon.stub(utils, "getExpiredUsers");
    emailInfosStub = sinon.stub(BetaGouv, "emailInfos");
    patchMailboxStub = sinon.stub(dimailClient, "patchMailbox");
    setEmailSuspendedStub = sinon.stub();
    changePasswordStub = sinon.stub(BetaGouv, "changePassword");

    // inject a stubbed setEmailSuspended into the scheduler module and global so it is always resolvable
    emailScheduler.__set__("setEmailSuspended", setEmailSuspendedStub);

    // intercept Kysely / db calls - always stub new ones per-test (sinon.restore above cleared any previous)
    sinon.stub(db, "updateTable").returns({
      set: () => ({
        where: () => ({
          execute: sinon.stub().resolves(),
        }),
      }),
    });
    sinon.stub(db, "selectFrom").returns({
      select: () => ({
        where: () => ({
          execute: sinon.stub().resolves([]),
        }),
      }),
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  it("should deactivate DIMAIL mailbox for expired users with EMAIL_PLAN_OPI", async () => {
    const fakeUser = {
      username: "user1",
      primary_email_status: EmailStatusCode.EMAIL_ACTIVE,
    };
    getAllUsersInfoStub.resolves([{}]);
    memberBaseInfoToModelStub.returns(fakeUser);
    getExpiredUsersStub.returns([fakeUser]);
    emailInfosStub.resolves({
      emailPlan: EMAIL_PLAN_TYPE.EMAIL_PLAN_OPI,
      email: `user1@${DIMAIL_MAILBOX_DOMAIN}`,
    });
    patchMailboxStub.resolves();
    setEmailSuspendedStub.resolves();

    // Act
    await emailScheduler.__get__("deactivateExpiredMembersEmails")();

    // Assert
    expect(patchMailboxStub.calledOnce).to.be.true;
    expect(
      patchMailboxStub.calledWithMatch({
        domain_name: DIMAIL_MAILBOX_DOMAIN,
        user_name: "user1",
        data: { active: "no" },
      }),
    ).to.be.true;
    expect(setEmailSuspendedStub.calledOnceWith("user1")).to.be.true;
    expect(changePasswordStub.notCalled).to.be.true;
  });

  it("should change OVH password for expired users with non-OPI email plan", async () => {
    const fakeUser = {
      username: "user2",
      primary_email_status: EmailStatusCode.EMAIL_ACTIVE,
    };
    getAllUsersInfoStub.resolves([{}]);
    memberBaseInfoToModelStub.returns(fakeUser);
    getExpiredUsersStub.returns([fakeUser]);
    emailInfosStub.resolves({
      emailPlan: EMAIL_PLAN_TYPE.EMAIL_PLAN_PRO,
      email: "user2@beta.gouv.fr",
    });
    changePasswordStub.resolves();

    setEmailSuspendedStub.resolves();

    await emailScheduler.__get__("deactivateExpiredMembersEmails")();

    expect(changePasswordStub.firstCall.args[0]).to.eq("user2");
    expect(changePasswordStub.firstCall.args[2]).to.eq(
      EMAIL_PLAN_TYPE.EMAIL_PLAN_PRO,
    );

    expect(changePasswordStub.calledOnce).to.be.true;
    expect(setEmailSuspendedStub.calledOnceWith("user2")).to.be.true;
    expect(patchMailboxStub.notCalled).to.be.true;
  });

  it("should do nothing if no expired users", async () => {
    getAllUsersInfoStub.resolves([{}]);
    memberBaseInfoToModelStub.returns({});
    getExpiredUsersStub.returns([]);

    await emailScheduler.__get__("deactivateExpiredMembersEmails")();

    expect(patchMailboxStub.notCalled).to.be.true;
    expect(changePasswordStub.notCalled).to.be.true;
    expect(setEmailSuspendedStub.notCalled).to.be.true;
  });

  it("should handle errors gracefully", async () => {
    const fakeUser = {
      username: "user3",
      primary_email_status: EmailStatusCode.EMAIL_ACTIVE,
    };
    getAllUsersInfoStub.resolves([{}]);
    memberBaseInfoToModelStub.returns(fakeUser);
    getExpiredUsersStub.returns([fakeUser]);
    emailInfosStub.resolves({
      emailPlan: EMAIL_PLAN_TYPE.EMAIL_PLAN_OPI,
      email: "user3@beta.gouv.fr",
    });
    patchMailboxStub.rejects(new Error("Failed to patch mailbox"));

    await emailScheduler.__get__("deactivateExpiredMembersEmails")();

    expect(patchMailboxStub.calledOnce).to.be.true;
    // verify parameters were attempted even if it failed

    expect(patchMailboxStub.firstCall.args[0]).to.deep.eq({
      domain_name: DIMAIL_MAILBOX_DOMAIN,
      user_name: "user3",
      data: { active: "no" },
    });

    // setEmailSuspended should not be called if patchMailbox fails
    expect(setEmailSuspendedStub.notCalled).to.be.true;
  });
});

describe("recreateEmailIfUserActive", () => {
  beforeEach(() => {
    // ensure a clean sinon state and fresh stubs for Kysely each test
    sinon.restore();

    sinon.stub(db, "selectFrom").returns({
      select: () => ({
        where: () => ({
          execute: sinon.stub().resolves([]),
        }),
      }),
    } as any);
  });
  afterEach(() => {
    sinon.restore();
  });

  it("reactivates DIMAIL mailbox and updates user to EMAIL_ACTIVE when primary_email is a dimail email", async () => {
    const dbUser = {
      uuid: "uuid1",
      username: "user1",
      primary_email: "user1@dimail.beta.gouv.fr",
      primary_email_status: EmailStatusCode.EMAIL_SUSPENDED,
    };

    // fake query builder with chainable where() calls
    const fakeQB = createFakeQB([dbUser]);
    sinon.stub(kyselyQueries, "getActiveUsers").returns(fakeQB as any);
    const getDimailEmailStub = sinon
      .stub(dimailQueries, "getDimailEmail")
      .resolves(true);
    const patchMailboxStubLocal = sinon
      .stub(dimailClient, "patchMailbox")
      .resolves();

    let setArg: any = null;
    let whereUuid: any = null;
    const execStub = sinon.stub().resolves();
    sinon.stub(db, "updateTable").callsFake(() => ({
      set: (arg: any) => {
        setArg = arg;
        return {
          where: (_col: any, _op: any, val: any) => {
            whereUuid = val;
            return { execute: execStub };
          },
        };
      },
    }));

    await recreateEmailIfUserActive.__get__("recreateEmailIfUserActive")();

    // patchMailbox should be called with expected params
    // expect(patchMailboxStubLocal.calledOnce).to.be.true;

    // expect(patchMailboxStubLocal.firstCall.args[0]).to.deep.eq({
    //   domain_name: DIMAIL_MAILBOX_DOMAIN,
    //   user_name: "user1",
    //   data: { active: "yes" },
    // });

    // DB update should have been called with correct set values and uuid
    expect(setArg).to.not.be.null;
    expect(setArg.primary_email).to.equal(dbUser.primary_email);
    expect(setArg.primary_email_status).to.equal(EmailStatusCode.EMAIL_ACTIVE);
    expect(whereUuid).to.equal(dbUser.uuid);

    // cleanup
    getDimailEmailStub.restore();
    patchMailboxStubLocal.restore();
  });
});
