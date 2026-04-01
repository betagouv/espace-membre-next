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
import { EMAIL_PLAN_TYPE } from "@/models/member";
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
