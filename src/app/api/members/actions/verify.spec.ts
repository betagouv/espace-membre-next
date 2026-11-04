import { expect } from "chai";
import sinon from "sinon";
import * as nextAuth from "next-auth/next";

import { safeVerify } from "./verify";
import * as authorizationLib from "@/lib/authorization/member";
import * as eventsLib from "@/lib/events";
import * as kyselyLib from "@/lib/kysely";
import * as usersQueries from "@/lib/kysely/queries/users";
import * as onboardingLib from "@/lib/onboarding/startMemberOnboarding";
import { EventCode } from "@/models/actionEvent/actionEvent";
import { EmailStatusCode } from "@/models/member";

const MEMBER_UUID = "0b1c6a52-8f4d-4d39-9d0b-6c1f1f7f9a02";

describe("verify (forced verification)", () => {
  let canEditMemberStub: sinon.SinonStub;
  let getUserBasicInfoStub: sinon.SinonStub;
  let activateStub: sinon.SinonStub;
  let addEventStub: sinon.SinonStub;
  let updateSetStub: sinon.SinonStub;

  const waitingUser = {
    uuid: MEMBER_UUID,
    username: "ada.lovelace",
    primary_email: "ada.lovelace@beta.gouv.fr",
    secondary_email: "ada@example.com",
    primary_email_status: EmailStatusCode.EMAIL_VERIFICATION_WAITING,
  };

  beforeEach(() => {
    sinon.restore();
    sinon
      .stub(nextAuth, "getServerSession")
      .resolves({ user: { id: "admin.user", uuid: "admin-uuid" } } as any);
    canEditMemberStub = sinon
      .stub(authorizationLib, "canEditMember")
      .resolves(true);
    getUserBasicInfoStub = sinon
      .stub(usersQueries, "getUserBasicInfo")
      .resolves(waitingUser as any);
    activateStub = sinon
      .stub(onboardingLib, "activateWithLoginEmail")
      .resolves("publicServiceEmail");
    addEventStub = sinon.stub(eventsLib, "addEvent").resolves();
    updateSetStub = sinon.stub();
    const builder = {
      set: updateSetStub.returnsThis(),
      where: sinon.stub().returnsThis(),
      executeTakeFirst: sinon.stub().resolves({ numUpdatedRows: BigInt(1) }),
    };
    sinon.stub(kyselyLib.db, "updateTable").returns(builder as any);
  });

  afterEach(() => {
    sinon.restore();
  });

  it("activates a fiche that already has its login email", async () => {
    const res = await safeVerify({ uuid: MEMBER_UUID });

    expect(res.success).to.be.true;
    expect(res.data).to.deep.equal({
      loginEmail: "ada.lovelace@beta.gouv.fr",
    });
    expect(updateSetStub.firstCall.args[0].primary_email_status).to.equal(
      EmailStatusCode.EMAIL_ACTIVE,
    );
    expect(activateStub.called).to.be.false;
    expect(addEventStub.firstCall.args[0].action_code).to.equal(
      EventCode.MEMBER_VERIFIED,
    );
  });

  it("gives a login email to a fiche accepted by the former flow, instead of activating it without one", async () => {
    getUserBasicInfoStub.resolves({
      ...waitingUser,
      primary_email: null,
      secondary_email: "ada@diplomatie.gouv.fr",
    } as any);

    const res = await safeVerify({ uuid: MEMBER_UUID });

    expect(res.success).to.be.true;
    expect(res.data).to.deep.equal({ loginEmail: "ada@diplomatie.gouv.fr" });
    expect(activateStub.calledOnceWith(MEMBER_UUID)).to.be.true;
    expect(updateSetStub.called).to.be.false;
    expect(addEventStub.calledOnce).to.be.true;
  });

  it("reports a mailbox in creation", async () => {
    getUserBasicInfoStub.resolves({
      ...waitingUser,
      primary_email: null,
    } as any);
    activateStub.resolves("mailbox");

    const res = await safeVerify({ uuid: MEMBER_UUID });

    expect(res.data).to.deep.equal({ mailboxPending: true });
  });

  it("refuses a fiche that is not waiting for verification", async () => {
    getUserBasicInfoStub.resolves({
      ...waitingUser,
      primary_email: null,
      primary_email_status: EmailStatusCode.EMAIL_ACTIVE,
    } as any);

    const res = await safeVerify({ uuid: MEMBER_UUID });

    expect(res.success).to.be.false;
    expect(updateSetStub.called).to.be.false;
    expect(activateStub.called).to.be.false;
    expect(addEventStub.called).to.be.false;
  });

  it("refuses someone who cannot edit the member", async () => {
    canEditMemberStub.resolves(false);

    const res = await safeVerify({ uuid: MEMBER_UUID });

    expect(res.success).to.be.false;
    expect(getUserBasicInfoStub.called).to.be.false;
    expect(updateSetStub.called).to.be.false;
  });
});
