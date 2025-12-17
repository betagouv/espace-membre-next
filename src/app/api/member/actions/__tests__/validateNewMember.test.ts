import { expect } from "chai";
import sinon from "sinon";
import * as nextAuth from "next-auth/next";
import * as eventsLib from "@/lib/events";
import * as kyselyLib from "@/lib/kysely";
import * as usersQueries from "@/lib/kysely/queries/users";
import * as mapperLib from "@/models/mapper";
import * as adminConfig from "@/server/config/admin.config";
import * as bossClient from "@/server/queueing/client";
import { validateNewMember } from "../validateNewMember";
import { EmailStatusCode } from "@/models/member";
import { EventCode } from "@/models/actionEvent";
import {
  AuthorizationError,
  BusinessError,
} from "@/utils/error";

describe("validateNewMember", () => {
  let getServerSessionStub: sinon.SinonStub;
  let getUserBasicInfoStub: sinon.SinonStub;
  let getLastEventStub: sinon.SinonStub;
  let dbSelectFromStub: sinon.SinonStub;
  let dbUpdateTableStub: sinon.SinonStub;
  let memberBaseInfoToModelStub: sinon.SinonStub;
  let isSessionUserIncubatorTeamAdminStub: sinon.SinonStub;
  let addEventStub: sinon.SinonStub;
  let getBossClientInstanceStub: sinon.SinonStub;
  let bossClientSendStub: sinon.SinonStub;

  const mockSession = {
    user: {
      id: "admin-user-id",
      uuid: "admin-user-uuid",
      isAdmin: false,
    },
  };

  const mockUserData = {
    uuid: "member-uuid",
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
    memberBaseInfoToModelStub = sinon
      .stub(mapperLib, "memberBaseInfoToModel")
      .returns(mockMember as any);
    isSessionUserIncubatorTeamAdminStub = sinon
      .stub(adminConfig, "isSessionUserIncubatorTeamAdminForUser")
      .resolves(true);
    addEventStub = sinon.stub(eventsLib, "addEvent").resolves();

    bossClientSendStub = sinon.stub().resolves();
    getBossClientInstanceStub = sinon
      .stub(bossClient, "getBossClientInstance")
      .resolves({ send: bossClientSendStub } as any);

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
      await validateNewMember({ memberUuid: "member-uuid" });
      expect.fail("Should have thrown AuthorizationError");
    } catch (e) {
      expect(e).to.be.instanceof(AuthorizationError);
    }
  });

  it("should throw BusinessError if user not found", async () => {
    getUserBasicInfoStub.resolves(null);

    try {
      await validateNewMember({ memberUuid: "member-uuid" });
      expect.fail("Should have thrown BusinessError");
    } catch (e) {
      expect(e).to.be.instanceof(BusinessError);
      expect((e as BusinessError).code).to.eq("userNotFound");
    }
  });

  it("should throw BusinessError if MEMBER_CREATED event not found", async () => {
    getLastEventStub.resolves(null);

    try {
      await validateNewMember({ memberUuid: "member-uuid" });
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
      await validateNewMember({ memberUuid: "member-uuid" });
      expect.fail("Should have thrown BusinessError");
    } catch (e) {
      expect(e).to.be.instanceof(BusinessError);
      expect((e as BusinessError).code).to.eq("userAlreadyValided");
    }
  });

  it("should throw BusinessError if session user not authorized", async () => {
    isSessionUserIncubatorTeamAdminStub.resolves(false);

    try {
      await validateNewMember({ memberUuid: "member-uuid" });
      expect.fail("Should have thrown BusinessError");
    } catch (e) {
      expect(e).to.be.instanceof(BusinessError);
      expect((e as BusinessError).code).to.eq(
        "sessionUserNotAdminOrNotInRequiredIncubatorTeam",
      );
    }
  });

  it("should successfully validate a new member", async () => {
    await validateNewMember({ memberUuid: "member-uuid" });

    // verify db update was called
    expect(dbUpdateTableStub.calledOnce).to.be.true;

    // verify addEvent was called
    expect(addEventStub.calledOnce).to.be.true;
    expect(addEventStub.firstCall.args[0]).to.deep.include({
      action_code: EventCode.MEMBER_VALIDATED,
      action_on_username: mockMember.username,
    });

    // verify boss client send was called twice (for both jobs)
    expect(bossClientSendStub.calledTwice).to.be.true;
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

    await validateNewMember({ memberUuid: "member-uuid" });

    // isSessionUserIncubatorTeamAdminForUser should not be called
    expect(isSessionUserIncubatorTeamAdminStub.notCalled).to.be.true;
  });
});
