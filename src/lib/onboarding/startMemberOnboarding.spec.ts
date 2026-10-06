import { expect } from "chai";
import sinon from "sinon";

import * as findUsersLib from "@/lib/auth/findUsersByLoginEmail";
import * as verificationEmailLib from "@/lib/email/send-verification-email";
import * as kyselyLib from "@/lib/kysely";
import * as usersQueries from "@/lib/kysely/queries/users";
import * as utilsLib from "@/lib/utils";
import { BusinessError } from "@/lib/error";
import {
  ONBOARDING_NOT_STARTED_STATUSES,
  startMemberOnboarding,
} from "@/lib/onboarding/startMemberOnboarding";
import { Domaine, EmailStatusCode } from "@/models/member";
import * as bossClient from "@/server/queueing/client";
import { createDimailMailboxTopic } from "@/server/queueing/workers/create-dimail-mailbox";

const USER_UUID = "0b1c6a52-8f4d-4d39-9d0b-6c1f1f7f9a01";

describe("startMemberOnboarding", () => {
  let getUserBasicInfoStub: sinon.SinonStub;
  let isPublicServiceEmailStub: sinon.SinonStub;
  let findUsersUsingEmailStub: sinon.SinonStub;
  let sendVerificationEmailStub: sinon.SinonStub;
  let bossSendStub: sinon.SinonStub;
  let updateSetStub: sinon.SinonStub;
  let updateWhereStub: sinon.SinonStub;
  let updateExecuteStub: sinon.SinonStub;

  const baseUser = {
    uuid: USER_UUID,
    username: "ada.lovelace",
    secondary_email: "ada@example.com",
    primary_email: null,
    domaine: Domaine.DEVELOPPEMENT,
    primary_email_status: EmailStatusCode.EMAIL_UNSET,
  };

  beforeEach(() => {
    sinon.restore();
    getUserBasicInfoStub = sinon
      .stub(usersQueries, "getUserBasicInfo")
      .resolves(baseUser as any);
    isPublicServiceEmailStub = sinon
      .stub(utilsLib, "isPublicServiceEmail")
      .resolves(false);
    findUsersUsingEmailStub = sinon
      .stub(findUsersLib, "findUsersUsingEmail")
      .resolves([]);
    sendVerificationEmailStub = sinon
      .stub(verificationEmailLib, "sendNewMemberVerificationEmail")
      .resolves();
    bossSendStub = sinon.stub().resolves("job-id");
    sinon
      .stub(bossClient, "getBossClientInstance")
      .resolves({ send: bossSendStub } as any);

    updateSetStub = sinon.stub();
    updateWhereStub = sinon.stub();
    updateExecuteStub = sinon.stub().resolves({ numUpdatedRows: BigInt(1) });
    const builder = {
      set: updateSetStub.returnsThis(),
      where: updateWhereStub.returnsThis(),
      executeTakeFirst: updateExecuteStub,
    };
    sinon.stub(kyselyLib.db, "updateTable").returns(builder as any);
  });

  afterEach(() => {
    sinon.restore();
  });

  it("personal email: sets EMAIL_CREATION_WAITING and enqueues the mailbox job, sends no email", async () => {
    await startMemberOnboarding(USER_UUID);

    expect(updateSetStub.firstCall.args[0].primary_email_status).to.equal(
      EmailStatusCode.EMAIL_CREATION_WAITING,
    );
    expect(bossSendStub.calledOnce).to.be.true;
    expect(bossSendStub.firstCall.args[0]).to.equal(createDimailMailboxTopic);
    expect(bossSendStub.firstCall.args[1]).to.deep.equal({
      userUuid: USER_UUID,
      username: "ada.lovelace",
      onboarding: true,
    });
    // the ProConnect invitation is sent by the worker once the mailbox exists
    expect(sendVerificationEmailStub.called).to.be.false;
  });

  it("personal email: puts the status back when the mailbox job cannot be enqueued", async () => {
    bossSendStub.rejects(new Error("pg-boss down"));

    try {
      await startMemberOnboarding(USER_UUID);
      expect.fail("Should have thrown");
    } catch (e: any) {
      expect(e.message).to.equal("pg-boss down");
    }

    expect(updateSetStub.calledTwice).to.be.true;
    expect(updateSetStub.secondCall.args[0].primary_email_status).to.equal(
      EmailStatusCode.EMAIL_UNSET,
    );
    // only undoes its own transition
    expect(
      updateWhereStub.calledWith(
        "primary_email_status",
        "=",
        EmailStatusCode.EMAIL_CREATION_WAITING,
      ),
    ).to.be.true;
    expect(sendVerificationEmailStub.called).to.be.false;
  });

  it("personal email: puts the status back when pg-boss creates no job", async () => {
    bossSendStub.resolves(null);

    try {
      await startMemberOnboarding(USER_UUID);
      expect.fail("Should have thrown");
    } catch (e: any) {
      expect(e.message).to.contain("mailbox job not created");
    }

    expect(updateSetStub.secondCall.args[0].primary_email_status).to.equal(
      EmailStatusCode.EMAIL_UNSET,
    );
  });

  it("only transitions an accepted member without primary email", async () => {
    await startMemberOnboarding(USER_UUID);
    expect(
      updateWhereStub.calledWith(
        "primary_email_status",
        "in",
        ONBOARDING_NOT_STARTED_STATUSES,
      ),
    ).to.be.true;
    expect(updateWhereStub.calledWith("primary_email", "is", null)).to.be.true;
  });

  it("starts from EMAIL_UNSET, and from the legacy EMAIL_VERIFICATION_WAITING without primary email", () => {
    expect(ONBOARDING_NOT_STARTED_STATUSES).to.have.members([
      EmailStatusCode.EMAIL_UNSET,
      EmailStatusCode.EMAIL_VERIFICATION_WAITING,
    ]);
  });

  it("is a no-op when the onboarding already started", async () => {
    updateExecuteStub.resolves({ numUpdatedRows: BigInt(0) });
    await startMemberOnboarding(USER_UUID);
    expect(bossSendStub.called).to.be.false;
    expect(sendVerificationEmailStub.called).to.be.false;
  });

  it("public service email: becomes the primary email and the invitation is sent", async () => {
    isPublicServiceEmailStub.resolves(true);
    getUserBasicInfoStub.resolves({
      ...baseUser,
      secondary_email: "ada@interieur.gouv.fr",
    } as any);

    await startMemberOnboarding(USER_UUID);

    expect(updateSetStub.firstCall.args[0].primary_email).to.equal(
      "ada@interieur.gouv.fr",
    );
    // the login email is ready : the member can now log in and verify
    expect(updateSetStub.firstCall.args[0].primary_email_status).to.equal(
      EmailStatusCode.EMAIL_VERIFICATION_WAITING,
    );
    expect(bossSendStub.called).to.be.false;
    expect(sendVerificationEmailStub.calledOnceWith({ userId: USER_UUID })).to
      .be.true;
    // DB is updated before the invitation is sent
    expect(sendVerificationEmailStub.calledAfter(updateExecuteStub)).to.be.true;
  });

  it("attributaire with a personal email: gets a mailbox like any other external member", async () => {
    getUserBasicInfoStub.resolves({
      ...baseUser,
      domaine: Domaine.ATTRIBUTAIRE,
    } as any);

    await startMemberOnboarding(USER_UUID);

    expect(updateSetStub.firstCall.args[0].primary_email_status).to.equal(
      EmailStatusCode.EMAIL_CREATION_WAITING,
    );
    expect(updateSetStub.firstCall.args[0].primary_email).to.be.undefined;
    expect(bossSendStub.calledOnce).to.be.true;
    expect(sendVerificationEmailStub.called).to.be.false;
  });

  it("attributaire with a public service email: that email becomes the primary email", async () => {
    isPublicServiceEmailStub.resolves(true);
    getUserBasicInfoStub.resolves({
      ...baseUser,
      domaine: Domaine.ATTRIBUTAIRE,
      secondary_email: "ada@interieur.gouv.fr",
    } as any);

    await startMemberOnboarding(USER_UUID);

    expect(updateSetStub.firstCall.args[0].primary_email).to.equal(
      "ada@interieur.gouv.fr",
    );
    expect(bossSendStub.called).to.be.false;
    expect(sendVerificationEmailStub.calledOnce).to.be.true;
  });

  it("refuses a public service email already used by another member", async () => {
    isPublicServiceEmailStub.resolves(true);
    findUsersUsingEmailStub.resolves([{ uuid: "other", username: "other" }]);
    try {
      await startMemberOnboarding(USER_UUID);
      expect.fail("Should have thrown");
    } catch (e: any) {
      expect(e).to.be.instanceof(BusinessError);
      expect(e.code).to.equal("emailAlreadyUsed");
    }
    expect(
      findUsersUsingEmailStub.calledWith("ada@example.com", {
        excludeUserUuid: USER_UUID,
      }),
    ).to.be.true;
    expect(sendVerificationEmailStub.called).to.be.false;
  });

  it("does nothing more for a public service member already onboarded", async () => {
    isPublicServiceEmailStub.resolves(true);
    updateExecuteStub.resolves({ numUpdatedRows: BigInt(0) });
    await startMemberOnboarding(USER_UUID);
    expect(sendVerificationEmailStub.called).to.be.false;
  });
});
