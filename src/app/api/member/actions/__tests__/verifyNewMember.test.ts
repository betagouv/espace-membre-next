import { expect } from "chai";
import jwt from "jsonwebtoken";
import sinon from "sinon";
import * as nextAuth from "next-auth/next";
import * as controllerUtils from "@/lib/utils";
import * as updateMemberModule from "@/app/api/member/updateMember";
import * as usersQueries from "@/lib/kysely/queries/users";
import * as bossClient from "@/server/queueing/client";
import * as onboardingLib from "@/lib/onboarding/startMemberOnboarding";
import { verifyNewMember } from "../verifyNewMember";
import { Domaine, EmailStatusCode } from "@/models/member";
import { AdminEmailNotAllowedError, BusinessError } from "@/lib/error";

describe("verifyNewMember", () => {
  let getServerSessionStub: sinon.SinonStub;
  let isPublicServiceEmailStub: sinon.SinonStub;
  let isAdminEmailStub: sinon.SinonStub;
  let updateMemberStub: sinon.SinonStub;
  let getUserBasicInfoStub: sinon.SinonStub;
  let getBossClientInstanceStub: sinon.SinonStub;

  // new members verify their fiche after a ProConnect + MFA login
  const mockSession = {
    user: {
      id: "johndoe",
      uuid: "00000000-0000-4000-8000-000000000123",
      provider: "proconnect",
      id_token: jwt.sign({ acr: "eidas1-mfa" }, "test"),
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
    missions: [
      {
        start: new Date(),
        end: new Date(Date.now() + 30 * 24 * 3600 * 1000),
        status: "independent",
        employer: "",
      },
    ],
    domaine: Domaine.DEVELOPPEMENT,
    bio: null,
    memberType: null,
    gender: null,
    secondary_email: "johndoe@example.com",
    average_nb_of_days: 5,
    legal_status: "AE",
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

    getUserBasicInfoStub = sinon
      .stub(usersQueries, "getUserBasicInfo")
      .resolves({
        uuid: mockSession.user.uuid,
        username: "johndoe",
        primary_email: "john.doe.ext@beta.gouv.fr",
        primary_email_status: EmailStatusCode.EMAIL_VERIFICATION_WAITING,
      } as any);

    getBossClientInstanceStub = sinon
      .stub(bossClient, "getBossClientInstance")
      .resolves({ send: sinon.stub().resolves() } as any);
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

  it("should validate input server-side", async () => {
    try {
      await verifyNewMember({ ...baseMemberData, secondary_email: "nope" });
      expect.fail("Should have thrown");
    } catch (e: any) {
      expect(e.name).to.equal("ZodError");
    }
    expect(updateMemberStub.called).to.be.false;
  });

  it("should refuse when the member is not waiting for verification", async () => {
    for (const status of [
      EmailStatusCode.EMAIL_ACTIVE,
      EmailStatusCode.EMAIL_CREATION_WAITING,
      EmailStatusCode.MEMBER_VALIDATION_WAITING,
    ]) {
      getUserBasicInfoStub.resolves({
        uuid: mockSession.user.uuid,
        primary_email_status: status,
      } as any);
      try {
        await verifyNewMember(baseMemberData);
        expect.fail(`Should have thrown for ${status}`);
      } catch (e) {
        expect(e).to.be.instanceof(BusinessError);
      }
    }
    expect(updateMemberStub.called).to.be.false;
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

  it("should only save the profile and activate the account", async () => {
    const result = await verifyNewMember(baseMemberData);

    expect(result).to.deep.equal({
      success: true,
      message: "L'utilisateur a bien été vérifié",
    });

    expect(updateMemberStub.calledOnce).to.be.true;
    const [, uuid, extraParams, createdBy] = updateMemberStub.firstCall.args;
    expect(uuid).to.equal(mockSession.user.uuid);
    expect(createdBy).to.equal(mockSession.user.id);
    expect(extraParams.primary_email_status).to.equal(
      EmailStatusCode.EMAIL_ACTIVE,
    );
    // primary/secondary emails are not touched anymore
    expect(extraParams).to.not.have.property("primary_email");
    expect(extraParams).to.not.have.property("secondary_email");
    // no mailbox creation from here
    expect(getBossClientInstanceStub.called).to.be.false;
  });

  describe("fiche accepted by the former flow, without login email", () => {
    let activateStub: sinon.SinonStub;

    beforeEach(() => {
      getUserBasicInfoStub.resolves({
        uuid: mockSession.user.uuid,
        username: "johndoe",
        primary_email: null,
        primary_email_status: EmailStatusCode.EMAIL_VERIFICATION_WAITING,
      } as any);
      activateStub = sinon
        .stub(onboardingLib, "activateWithLoginEmail")
        .resolves("publicServiceEmail");
    });

    it("saves the profile without activating it, then gives it a login email", async () => {
      const result = await verifyNewMember(baseMemberData);

      expect(result.success).to.be.true;
      expect(updateMemberStub.calledOnce).to.be.true;
      expect(updateMemberStub.firstCall.args[2]).to.deep.equal({});
      expect(activateStub.calledOnceWith(mockSession.user.uuid)).to.be.true;
      expect(activateStub.calledAfter(updateMemberStub)).to.be.true;
    });

    it("tells the member a mailbox is on its way", async () => {
      activateStub.resolves("mailbox");

      const result = await verifyNewMember(baseMemberData);

      expect(result.success).to.be.true;
      expect(result.message).to.include("en cours de création");
    });

    it("returns the refusal when the email belongs to another member", async () => {
      activateStub.rejects(
        new BusinessError("emailAlreadyUsed", "déjà utilisé"),
      );

      const result = await verifyNewMember(baseMemberData);

      expect(result).to.deep.equal({ success: false, message: "déjà utilisé" });
    });
  });
});
