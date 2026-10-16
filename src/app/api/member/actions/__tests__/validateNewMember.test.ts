import { expect } from "chai";
import sinon from "sinon";
import * as nextAuth from "next-auth/next";
import * as eventsLib from "@/lib/events";
import * as kyselyLib from "@/lib/kysely";
import * as usersQueries from "@/lib/kysely/queries/users";
import * as mapperLib from "@/models/mapper";
import * as canEditMemberLib from "@/lib/canEditMember";
import * as sendEmailToTeamLib from "@/lib/email/send-email-to-team-when-new-member";
import * as sendVerificationEmailLib from "@/lib/email/send-verification-email";
import { validateNewMember } from "../validateNewMember";
import { Domaine, EmailStatusCode } from "@/models/member";
import { EventCode } from "@/models/actionEvent";
import { AuthorizationError, BusinessError } from "@/lib/error";

describe("validateNewMember", () => {
  let getServerSessionStub: sinon.SinonStub;
  let getUserBasicInfoStub: sinon.SinonStub;
  let getLastEventStub: sinon.SinonStub;
  let dbSelectFromStub: sinon.SinonStub;
  let dbUpdateTableStub: sinon.SinonStub;
  let memberBaseInfoToModelStub: sinon.SinonStub;
  let canEditMemberStub: sinon.SinonStub;
  let addEventStub: sinon.SinonStub;
  let sendEmailToTeamWhenNewMemberStub: sinon.SinonStub;
  let sendNewMemberVerificationEmailStub: sinon.SinonStub;

  const memberUuid = "11111111-1111-4111-8111-111111111111";
  const incubatorUuid = "22222222-2222-4222-8222-222222222222";

  const mockSession = {
    user: {
      id: "admin-user-id",
      uuid: "admin-user-uuid",
      isAdmin: false,
    },
  };

  const mockUserData = {
    uuid: memberUuid,
    username: "testmember",
    primary_email_status: EmailStatusCode.MEMBER_VALIDATION_WAITING,
  };

  const mockMember = {
    ...mockUserData,
    username: "testmember",
  };

  const mockEventMemberCreated = {
    action_code: EventCode.MEMBER_CREATED,
    action_on_username: "testmember",
    action_metadata: {
      member: {
        firstname: "Test",
        lastname: "Member",
        email: "test.member@example.com",
        domaine: Domaine.DEVELOPPEMENT,
      },
      missions: [
        {
          start: new Date("2026-01-01"),
          status: "admin",
          startups: [],
        },
      ],
      incubator_id: incubatorUuid,
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
    memberBaseInfoToModelStub = sinon
      .stub(mapperLib, "memberBaseInfoToModel")
      .returns(mockMember as any);
    canEditMemberStub = sinon
      .stub(canEditMemberLib, "canEditMember")
      .resolves(true);
    addEventStub = sinon.stub(eventsLib, "addEvent").resolves();

    sendEmailToTeamWhenNewMemberStub = sinon
      .stub(sendEmailToTeamLib, "sendEmailToTeamWhenNewMember")
      .resolves();
    sendNewMemberVerificationEmailStub = sinon
      .stub(sendVerificationEmailLib, "sendNewMemberVerificationEmail")
      .resolves();

    // stub db chainable query builder
    dbUpdateTableStub = sinon.stub(kyselyLib.db, "updateTable").returns({
      where: sinon.stub().returnsThis(),
      set: sinon.stub().returnsThis(),
      execute: sinon.stub().resolves(),
    } as any);

    dbSelectFromStub = sinon.stub(kyselyLib.db, "selectFrom").returns({
      selectAll: sinon.stub().returnsThis(),
      where: sinon.stub().returnsThis(),
      orderBy: sinon.stub().returnsThis(),
      executeTakeFirst: sinon.stub().resolves(null),
    } as any);
  });

  afterEach(() => {
    sinon.restore();
  });

  it("should throw AuthorizationError if no session", async () => {
    getServerSessionStub.resolves(null);

    try {
      await validateNewMember({ memberUuid });
      expect.fail("Should have thrown AuthorizationError");
    } catch (e) {
      expect(e).to.be.instanceof(AuthorizationError);
    }
  });

  it("should throw BusinessError if user not found", async () => {
    getUserBasicInfoStub.resolves(null);

    try {
      await validateNewMember({ memberUuid });
      expect.fail("Should have thrown BusinessError");
    } catch (e) {
      expect(e).to.be.instanceof(BusinessError);
      expect((e as BusinessError).code).to.eq("userNotFound");
    }
  });

  it("should throw BusinessError if MEMBER_CREATED event not found", async () => {
    getLastEventStub.resolves(null);

    try {
      await validateNewMember({ memberUuid });
      expect.fail("Should have thrown BusinessError");
    } catch (e) {
      expect(e).to.be.instanceof(BusinessError);
      expect((e as BusinessError).code).to.eq("userMemberCreatedEventNotFound");
    }
  });

  it("should throw BusinessError if member already validated", async () => {
    dbSelectFromStub().executeTakeFirst.resolves({
      created_by_username: "another-admin",
    });

    try {
      await validateNewMember({ memberUuid });
      expect.fail("Should have thrown BusinessError");
    } catch (e) {
      expect(e).to.be.instanceof(BusinessError);
      expect((e as BusinessError).code).to.eq("userAlreadyValided");
    }
  });

  it("should throw BusinessError if session user not authorized", async () => {
    canEditMemberStub.resolves(false);

    try {
      await validateNewMember({ memberUuid });
      expect.fail("Should have thrown BusinessError");
    } catch (e) {
      expect(e).to.be.instanceof(BusinessError);
      expect((e as BusinessError).code).to.eq(
        "sessionUserNotAdminOrNotInRequiredIncubatorTeam",
      );
    }
  });

  it("should successfully validate a new member", async () => {
    await validateNewMember({ memberUuid });

    // verify db update was called
    expect(dbUpdateTableStub.calledOnce).to.be.true;

    // verify addEvent was called
    expect(addEventStub.calledOnce).to.be.true;
    expect(addEventStub.firstCall.args[0]).to.deep.include({
      action_code: EventCode.MEMBER_VALIDATED,
      action_on_username: mockMember.username,
    });

    expect(
      sendEmailToTeamWhenNewMemberStub.calledOnceWith({ userId: memberUuid }),
    ).to.be.true;
    expect(
      sendNewMemberVerificationEmailStub.calledOnceWith({ userId: memberUuid }),
    ).to.be.true;
  });

  it("should use isAdmin flag when session user is admin", async () => {
    const adminSession = {
      user: {
        id: "admin-user-id",
        uuid: "admin-user-uuid",
        isAdmin: true,
      },
    };
    getServerSessionStub.resolves(adminSession as any);

    await validateNewMember({ memberUuid });

    // canEditMember is called but returns early for admins
    expect(canEditMemberStub.calledOnce).to.be.true;
  });
});
