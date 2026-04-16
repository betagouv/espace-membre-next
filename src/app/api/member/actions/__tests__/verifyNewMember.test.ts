import { expect } from "chai";
import sinon from "sinon";
import * as nextAuth from "next-auth/next";
import * as controllerUtils from "@/server/controllers/utils";
import * as updateMemberModule from "@/app/api/member/updateMember";
import * as bossClient from "@/server/queueing/client";
import { verifyNewMember } from "../verifyNewMember";
import { Domaine, EmailStatusCode } from "@/models/member";
import { AdminEmailNotAllowedError } from "@/utils/error";

describe("verifyNewMember", () => {
  let getServerSessionStub: sinon.SinonStub;
  let isPublicServiceEmailStub: sinon.SinonStub;
  let isAdminEmailStub: sinon.SinonStub;
  let updateMemberStub: sinon.SinonStub;
  let getBossClientInstanceStub: sinon.SinonStub;
  let bossClientSendStub: sinon.SinonStub;

  const mockSession = {
    user: {
      id: "johndoe",
      uuid: "user-uuid-123",
    },
  };

  const baseMemberData = {
    username: "johndoe",
    fullname: "John Doe",
    role: "Developer",
    link: null,
    avatar: null,
    github: null,
    competences: [],
    missions: [],
    domaine: Domaine.DEVELOPPEMENT,
    bio: null,
    memberType: null,
    gender: null,
    secondary_email: "johndoe@example.com",
    average_nb_of_days: null,
    tjm: null,
    legal_status: null,
    workplace_insee_code: null,
    osm_city: null,
  } as any;

  beforeEach(() => {
    sinon.restore();

    getServerSessionStub = sinon
      .stub(nextAuth, "getServerSession")
      .resolves(mockSession as any);

    isPublicServiceEmailStub = sinon
      .stub(controllerUtils, "isPublicServiceEmail")
      .resolves(false);

    isAdminEmailStub = sinon
      .stub(controllerUtils, "isAdminEmail")
      .returns(false);

    updateMemberStub = sinon
      .stub(updateMemberModule, "updateMember")
      .resolves(undefined as any);

    bossClientSendStub = sinon.stub().resolves();
    getBossClientInstanceStub = sinon
      .stub(bossClient, "getBossClientInstance")
      .resolves({ send: bossClientSendStub } as any);
  });

  afterEach(() => {
    sinon.restore();
  });

  it("should throw if no session", async () => {
    getServerSessionStub.resolves(null);

    try {
      await verifyNewMember(baseMemberData);
      expect.fail("Should have thrown");
    } catch (e: any) {
      expect(e.message).to.include("don't have the right");
    }
  });

  it("should throw if session user does not match username", async () => {
    getServerSessionStub.resolves({
      user: { id: "otheruser", uuid: "other-uuid" },
    } as any);

    try {
      await verifyNewMember(baseMemberData);
      expect.fail("Should have thrown");
    } catch (e: any) {
      expect(e.message).to.include("don't have the right");
    }
  });

  it("should throw AdminEmailNotAllowedError if email is both public service and admin", async () => {
    isPublicServiceEmailStub.resolves(true);
    isAdminEmailStub.returns(true);

    try {
      await verifyNewMember(baseMemberData);
      expect.fail("Should have thrown AdminEmailNotAllowedError");
    } catch (e) {
      expect(e).to.be.instanceof(AdminEmailNotAllowedError);
    }
  });

  it("should create new email when secondary_email is not public service and not attributaire", async () => {
    isPublicServiceEmailStub.resolves(false);

    await verifyNewMember(baseMemberData);

    expect(updateMemberStub.calledOnce).to.be.true;
    const updateArgs = updateMemberStub.firstCall.args;
    expect(updateArgs[2]).to.deep.include({
      primary_email: null,
      secondary_email: baseMemberData.secondary_email,
      primary_email_status: EmailStatusCode.EMAIL_CREATION_WAITING,
    });

    expect(getBossClientInstanceStub.calledOnce).to.be.true;
    expect(bossClientSendStub.calledOnce).to.be.true;
    expect(bossClientSendStub.firstCall.args[1]).to.deep.include({
      username: baseMemberData.username,
      userUuid: mockSession.user.uuid,
    });
  });

  it("should not create new email when secondary_email is public service", async () => {
    isPublicServiceEmailStub.resolves(true);
    isAdminEmailStub.returns(false);

    await verifyNewMember(baseMemberData);

    expect(updateMemberStub.calledOnce).to.be.true;
    const updateArgs = updateMemberStub.firstCall.args;
    expect(updateArgs[2]).to.deep.include({
      primary_email: baseMemberData.secondary_email,
      secondary_email: null,
      primary_email_status: EmailStatusCode.EMAIL_ACTIVE,
    });

    expect(bossClientSendStub.called).to.be.false;
  });

  it("should not create new email when domaine is ATTRIBUTAIRE", async () => {
    const attributaireMemberData = {
      ...baseMemberData,
      domaine: Domaine.ATTRIBUTAIRE,
    };
    isPublicServiceEmailStub.resolves(false);

    await verifyNewMember(attributaireMemberData);

    expect(updateMemberStub.calledOnce).to.be.true;
    const updateArgs = updateMemberStub.firstCall.args;
    expect(updateArgs[2]).to.deep.include({
      primary_email: baseMemberData.secondary_email,
      secondary_email: null,
      primary_email_status: EmailStatusCode.EMAIL_ACTIVE,
    });

    expect(bossClientSendStub.called).to.be.false;
  });

  it("should return success message", async () => {
    const result = await verifyNewMember(baseMemberData);

    expect(result).to.deep.equal({
      success: true,
      message: "L'utilisateur a bien été vérifié",
    });
  });
});
