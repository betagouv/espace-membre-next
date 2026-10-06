import { expect } from "chai";
import sinon from "sinon";
import * as nextAuth from "next-auth/next";
import * as eventsLib from "@/lib/events";
import * as kyselyLib from "@/lib/kysely";
import * as usersQueries from "@/lib/kysely/queries/users";
import * as canEditMemberLib from "@/lib/canEditMember";
import * as teamEmailLib from "@/lib/email/send-email-to-team-when-new-member";
import * as onboardingLib from "@/lib/onboarding/startMemberOnboarding";
import { validateNewMember } from "../validateNewMember";
import { EmailStatusCode } from "@/models/member";
import { EventCode } from "@/models/actionEvent";
import { AuthorizationError, BusinessError } from "@/lib/error";

const MEMBER_UUID = "6d2f8f4e-3c1a-4b8e-9f1d-2a7c5e9b0d13";

describe("validateNewMember", () => {
  let getServerSessionStub: sinon.SinonStub;
  let getUserBasicInfoStub: sinon.SinonStub;
  let getLastEventStub: sinon.SinonStub;
  let dbUpdateTableStub: sinon.SinonStub;
  let updateExecuteStub: sinon.SinonStub;
  let updateWhereStub: sinon.SinonStub;
  let updateSetStub: sinon.SinonStub;
  let canEditMemberStub: sinon.SinonStub;
  let addEventStub: sinon.SinonStub;
  let sendEmailToTeamStub: sinon.SinonStub;
  let startMemberOnboardingStub: sinon.SinonStub;

  const mockSession = {
    user: {
      id: "admin-user-id",
      uuid: "admin-user-uuid",
      isAdmin: false,
    },
  };

  const mockUserData = {
    uuid: MEMBER_UUID,
    username: "testmember",
    primary_email_status: EmailStatusCode.MEMBER_VALIDATION_WAITING,
  };

  const mockEventMemberCreated = {
    action_code: EventCode.MEMBER_CREATED,
    action_on_username: "testmember",
    action_metadata: {
      incubator_id: "incubator-1",
    },
  };

  beforeEach(() => {
    sinon.restore();

    getServerSessionStub = sinon
      .stub(nextAuth, "getServerSession")
      .resolves(mockSession as any);
    getUserBasicInfoStub = sinon
      .stub(usersQueries, "getUserBasicInfo")
      .resolves(mockUserData as any);
    getLastEventStub = sinon
      .stub(eventsLib, "getLastEvent")
      .resolves(mockEventMemberCreated as any);
    canEditMemberStub = sinon
      .stub(canEditMemberLib, "canEditMember")
      .resolves(true);
    addEventStub = sinon.stub(eventsLib, "addEvent").resolves();
    sendEmailToTeamStub = sinon
      .stub(teamEmailLib, "sendEmailToTeamWhenNewMember")
      .resolves();
    startMemberOnboardingStub = sinon
      .stub(onboardingLib, "startMemberOnboarding")
      .resolves();

    // stub db chainable update builder
    updateExecuteStub = sinon.stub().resolves({ numUpdatedRows: BigInt(1) });
    updateWhereStub = sinon.stub();
    updateSetStub = sinon.stub();
    const updateBuilder = {
      set: updateSetStub.returnsThis(),
      where: updateWhereStub.returnsThis(),
      executeTakeFirst: updateExecuteStub,
    };
    dbUpdateTableStub = sinon
      .stub(kyselyLib.db, "updateTable")
      .returns(updateBuilder as any);
  });

  afterEach(() => {
    sinon.restore();
  });

  it("should throw AuthorizationError if no session", async () => {
    getServerSessionStub.resolves(null);
    try {
      await validateNewMember({ memberUuid: MEMBER_UUID });
      expect.fail("Should have thrown");
    } catch (e) {
      expect(e).to.be.instanceof(AuthorizationError);
    }
  });

  it("should throw BusinessError if user not found", async () => {
    getUserBasicInfoStub.resolves(null);
    try {
      await validateNewMember({ memberUuid: MEMBER_UUID });
      expect.fail("Should have thrown");
    } catch (e: any) {
      expect(e).to.be.instanceof(BusinessError);
      expect(e.code).to.equal("userNotFound");
    }
  });

  it("should pass the incubator from the MEMBER_CREATED event to canEditMember", async () => {
    await validateNewMember({ memberUuid: MEMBER_UUID });
    expect(getLastEventStub.firstCall.args).to.deep.equal([
      "testmember",
      EventCode.MEMBER_CREATED,
    ]);
    expect(canEditMemberStub.firstCall.args[0].incubator_id).to.equal(
      "incubator-1",
    );
  });

  it("should not fail when the MEMBER_CREATED event is missing (admin can still validate)", async () => {
    getLastEventStub.resolves(null);
    getServerSessionStub.resolves({
      user: { ...mockSession.user, isAdmin: true },
    } as any);
    await validateNewMember({ memberUuid: MEMBER_UUID });
    expect(canEditMemberStub.firstCall.args[0].incubator_id).to.be.undefined;
    expect(startMemberOnboardingStub.calledOnceWith(MEMBER_UUID)).to.be.true;
  });

  it("should check rights before anything else, even for an already validated member", async () => {
    canEditMemberStub.resolves(false);
    updateExecuteStub.resolves({ numUpdatedRows: BigInt(0) });
    try {
      await validateNewMember({ memberUuid: MEMBER_UUID });
      expect.fail("Should have thrown");
    } catch (e: any) {
      expect(e).to.be.instanceof(BusinessError);
      expect(e.code).to.equal(
        "sessionUserNotAdminOrNotInRequiredIncubatorTeam",
      );
    }
    expect(dbUpdateTableStub.called).to.be.false;
    expect(startMemberOnboardingStub.called).to.be.false;
  });

  it("should throw userAlreadyValided and not onboard twice when the status already changed", async () => {
    updateExecuteStub.resolves({ numUpdatedRows: BigInt(0) });
    try {
      await validateNewMember({ memberUuid: MEMBER_UUID });
      expect.fail("Should have thrown");
    } catch (e: any) {
      expect(e).to.be.instanceof(BusinessError);
      expect(e.code).to.equal("userAlreadyValided");
    }
    expect(addEventStub.called).to.be.false;
    expect(startMemberOnboardingStub.called).to.be.false;
  });

  it("should only update a member waiting for validation (atomic transition)", async () => {
    await validateNewMember({ memberUuid: MEMBER_UUID });
    expect(
      updateWhereStub.calledWith(
        "primary_email_status",
        "=",
        EmailStatusCode.MEMBER_VALIDATION_WAITING,
      ),
    ).to.be.true;
  });

  it("should put the validated member in EMAIL_UNSET (no login email yet)", async () => {
    await validateNewMember({ memberUuid: MEMBER_UUID });
    expect(updateSetStub.firstCall.args[0].primary_email_status).to.equal(
      EmailStatusCode.EMAIL_UNSET,
    );
  });

  it("should validate the member then start the onboarding", async () => {
    await validateNewMember({ memberUuid: MEMBER_UUID });

    expect(
      addEventStub.calledOnceWith({
        created_by_username: "admin-user-id",
        action_code: EventCode.MEMBER_VALIDATED,
        action_on_username: "testmember",
      }),
    ).to.be.true;
    expect(sendEmailToTeamStub.calledOnce).to.be.true;
    expect(startMemberOnboardingStub.calledOnceWith(MEMBER_UUID)).to.be.true;
    expect(startMemberOnboardingStub.calledAfter(addEventStub)).to.be.true;
    expect(sendEmailToTeamStub.calledAfter(startMemberOnboardingStub)).to.be
      .true;
  });

  it("should not fail when the team announcement fails", async () => {
    sendEmailToTeamStub.rejects(new Error("smtp down"));
    sinon.stub(console, "error");

    await validateNewMember({ memberUuid: MEMBER_UUID });

    expect(startMemberOnboardingStub.calledOnceWith(MEMBER_UUID)).to.be.true;
  });

  const activeMission = [{ end: new Date(Date.now() + 30 * 24 * 3600 * 1000) }];
  const endedMission = [{ end: new Date(Date.now() - 30 * 24 * 3600 * 1000) }];

  it("should restart the onboarding of a validated member whose onboarding never started", async () => {
    updateExecuteStub.resolves({ numUpdatedRows: BigInt(0) });
    getUserBasicInfoStub.resolves({
      ...mockUserData,
      primary_email_status: EmailStatusCode.EMAIL_UNSET,
      primary_email: null,
      missions: activeMission,
    } as any);

    await validateNewMember({ memberUuid: MEMBER_UUID });

    expect(startMemberOnboardingStub.calledOnceWith(MEMBER_UUID)).to.be.true;
    // not validated a second time
    expect(addEventStub.called).to.be.false;
    expect(sendEmailToTeamStub.called).to.be.false;
  });

  it("should restart the onboarding of a fiche accepted before the change (EMAIL_VERIFICATION_WAITING without primary email)", async () => {
    updateExecuteStub.resolves({ numUpdatedRows: BigInt(0) });
    getUserBasicInfoStub.resolves({
      ...mockUserData,
      primary_email_status: EmailStatusCode.EMAIL_VERIFICATION_WAITING,
      primary_email: null,
      missions: activeMission,
    } as any);

    await validateNewMember({ memberUuid: MEMBER_UUID });

    expect(startMemberOnboardingStub.calledOnceWith(MEMBER_UUID)).to.be.true;
  });

  it("should not restart the onboarding of an old EMAIL_UNSET fiche whose mission is over", async () => {
    updateExecuteStub.resolves({ numUpdatedRows: BigInt(0) });
    getUserBasicInfoStub.resolves({
      ...mockUserData,
      primary_email_status: EmailStatusCode.EMAIL_UNSET,
      primary_email: null,
      missions: endedMission,
    } as any);

    try {
      await validateNewMember({ memberUuid: MEMBER_UUID });
      expect.fail("Should have thrown");
    } catch (e: any) {
      expect(e.code).to.equal("userAlreadyValided");
    }
    expect(startMemberOnboardingStub.called).to.be.false;
  });

  it("should not restart the onboarding of a member who already has a primary email", async () => {
    updateExecuteStub.resolves({ numUpdatedRows: BigInt(0) });
    getUserBasicInfoStub.resolves({
      ...mockUserData,
      primary_email_status: EmailStatusCode.EMAIL_VERIFICATION_WAITING,
      primary_email: "test.member.ext@beta.gouv.fr",
      missions: activeMission,
    } as any);

    try {
      await validateNewMember({ memberUuid: MEMBER_UUID });
      expect.fail("Should have thrown");
    } catch (e: any) {
      expect(e.code).to.equal("userAlreadyValided");
    }
    expect(startMemberOnboardingStub.called).to.be.false;
  });
});
