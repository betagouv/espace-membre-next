import { expect } from "chai";
import sinon from "sinon";

import * as findUsersLib from "@/lib/auth/findUsersByLoginEmail";
import * as verificationEmailLib from "@/lib/email/send-verification-email";
import * as eventsLib from "@/lib/events";
import * as kyselyLib from "@/lib/kysely";
import * as usersQueries from "@/lib/kysely/queries/users";
import * as utilsLib from "@/lib/utils";
import { DIMAIL_MAILBOX_DOMAIN } from "@/lib/dimail/utils";
import { BusinessError } from "@/lib/error";
import {
  activateWithLoginEmail,
  resumeMemberOnboarding,
  startMemberOnboarding,
} from "@/lib/onboarding/startMemberOnboarding";
import { EventCode } from "@/models/actionEvent";
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
  let getLastEventStub: sinon.SinonStub;
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
    getLastEventStub = sinon.stub(eventsLib, "getLastEvent").resolves(null);
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
    expect(bossSendStub.firstCall.args[2].singletonKey).to.equal(
      `onboarding-mailbox-${USER_UUID}`,
    );
    // the ProConnect invitation is sent by the worker once the mailbox exists
    expect(sendVerificationEmailStub.called).to.be.false;
  });

  for (const [trigger, setup] of [
    [
      "cannot be enqueued",
      () => bossSendStub.rejects(new Error("pg-boss down")),
    ],
    ["is not created by pg-boss", () => bossSendStub.resolves(null)],
  ] as const) {
    it(`personal email: puts the status back when the mailbox job ${trigger}`, async () => {
      setup();

      try {
        await startMemberOnboarding(USER_UUID);
        expect.fail("Should have thrown");
      } catch (e: any) {
        expect(e.message).to.match(/pg-boss down|mailbox job not created/);
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
  }

  it("is a no-op when the onboarding already started, whatever the email", async () => {
    updateExecuteStub.resolves({ numUpdatedRows: BigInt(0) });
    await startMemberOnboarding(USER_UUID);
    isPublicServiceEmailStub.resolves(true);
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

  it("attributaire: only the email decides, like any other member", async () => {
    getUserBasicInfoStub.resolves({
      ...baseUser,
      domaine: Domaine.ATTRIBUTAIRE,
    } as any);

    await startMemberOnboarding(USER_UUID);

    expect(updateSetStub.firstCall.args[0].primary_email_status).to.equal(
      EmailStatusCode.EMAIL_CREATION_WAITING,
    );

    isPublicServiceEmailStub.resolves(true);
    getUserBasicInfoStub.resolves({
      ...baseUser,
      domaine: Domaine.ATTRIBUTAIRE,
      secondary_email: "ada@interieur.gouv.fr",
    } as any);
    await startMemberOnboarding(USER_UUID);

    expect(updateSetStub.secondCall.args[0].primary_email).to.equal(
      "ada@interieur.gouv.fr",
    );
    expect(bossSendStub.calledOnce).to.be.true;
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

  describe("resumeMemberOnboarding", () => {
    const resumeWith = (user: Record<string, unknown>) => {
      getUserBasicInfoStub.resolves({ ...baseUser, ...user } as any);
      return resumeMemberOnboarding(USER_UUID);
    };

    it("starts an onboarding that never started, legacy status included", async () => {
      expect(await resumeWith({})).to.be.true;
      expect(
        await resumeWith({
          primary_email_status: EmailStatusCode.EMAIL_VERIFICATION_WAITING,
        }),
      ).to.be.true;
      expect(updateSetStub.callCount).to.equal(2);
      expect(bossSendStub.calledTwice).to.be.true;
    });

    it("enqueues the mailbox job again for a member stuck in EMAIL_CREATION_WAITING", async () => {
      const resumed = await resumeWith({
        primary_email_status: EmailStatusCode.EMAIL_CREATION_WAITING,
      });

      expect(resumed).to.be.true;
      expect(updateSetStub.called).to.be.false;
      expect(bossSendStub.calledOnce).to.be.true;
      expect(bossSendStub.firstCall.args[1].onboarding).to.be.true;
      expect(bossSendStub.firstCall.args[2].singletonKey).to.equal(
        `onboarding-mailbox-${USER_UUID}`,
      );
    });

    it("does nothing while the mailbox job is still pending", async () => {
      bossSendStub.resolves(null);

      const resumed = await resumeWith({
        primary_email_status: EmailStatusCode.EMAIL_CREATION_WAITING,
      });

      expect(resumed).to.be.false;
    });

    it("sends the invitation that never left to a public service email", async () => {
      const resumed = await resumeWith({
        primary_email: "ada@interieur.gouv.fr",
        primary_email_status: EmailStatusCode.EMAIL_VERIFICATION_WAITING,
      });

      expect(resumed).to.be.true;
      expect(
        getLastEventStub.calledWith(
          "ada.lovelace",
          EventCode.EMAIL_VERIFICATION_WAITING_SENT,
        ),
      ).to.be.true;
      expect(sendVerificationEmailStub.calledOnceWith({ userId: USER_UUID })).to
        .be.true;
      expect(bossSendStub.called).to.be.false;
    });

    it("lets the mailbox job send the invitation that never left to a new mailbox", async () => {
      const resumed = await resumeWith({
        primary_email: `ada.lovelace.ext@${DIMAIL_MAILBOX_DOMAIN}`,
        primary_email_status: EmailStatusCode.EMAIL_VERIFICATION_WAITING,
      });

      expect(resumed).to.be.true;
      expect(bossSendStub.calledOnce).to.be.true;
      expect(sendVerificationEmailStub.called).to.be.false;
    });

    it("does nothing once the invitation is sent or the member is active", async () => {
      getLastEventStub.resolves({
        action_code: EventCode.EMAIL_VERIFICATION_WAITING_SENT,
      });
      expect(
        await resumeWith({
          primary_email: "ada@interieur.gouv.fr",
          primary_email_status: EmailStatusCode.EMAIL_VERIFICATION_WAITING,
        }),
      ).to.be.false;
      expect(
        await resumeWith({
          primary_email: "ada@interieur.gouv.fr",
          primary_email_status: EmailStatusCode.EMAIL_ACTIVE,
        }),
      ).to.be.false;
      expect(bossSendStub.called).to.be.false;
      expect(sendVerificationEmailStub.called).to.be.false;
      expect(updateSetStub.called).to.be.false;
    });

    it("activates a fiche left active without login email", async () => {
      isPublicServiceEmailStub.resolves(true);

      const resumed = await resumeWith({
        secondary_email: "ada@interieur.gouv.fr",
        primary_email_status: EmailStatusCode.EMAIL_ACTIVE,
      });

      expect(resumed).to.be.true;
      expect(updateSetStub.firstCall.args[0]).to.include({
        primary_email: "ada@interieur.gouv.fr",
        primary_email_status: EmailStatusCode.EMAIL_ACTIVE,
      });
      expect(sendVerificationEmailStub.called).to.be.false;
    });
  });

  describe("activateWithLoginEmail", () => {
    const activateWith = (user: Record<string, unknown>) => {
      getUserBasicInfoStub.resolves({ ...baseUser, ...user } as any);
      return activateWithLoginEmail(USER_UUID);
    };

    for (const status of [
      EmailStatusCode.EMAIL_UNSET,
      EmailStatusCode.EMAIL_VERIFICATION_WAITING,
      EmailStatusCode.EMAIL_ACTIVE,
    ]) {
      it(`public service email: becomes the login email of a ${status} fiche, activated without invitation`, async () => {
        isPublicServiceEmailStub.resolves(true);

        const activation = await activateWith({
          secondary_email: "ada@diplomatie.gouv.fr",
          primary_email_status: status,
        });

        expect(activation).to.equal("publicServiceEmail");
        const set = updateSetStub.firstCall.args[0];
        expect(set.primary_email).to.equal("ada@diplomatie.gouv.fr");
        expect(set.primary_email_status).to.equal(EmailStatusCode.EMAIL_ACTIVE);
        expect(updateWhereStub.calledWith("primary_email", "is", null)).to.be
          .true;
        expect(bossSendStub.called).to.be.false;
        expect(sendVerificationEmailStub.called).to.be.false;
      });
    }

    it("refuses a public service email already used by another member", async () => {
      isPublicServiceEmailStub.resolves(true);
      findUsersUsingEmailStub.resolves([{ username: "someone.else" }]);

      try {
        await activateWith({
          secondary_email: "ada@diplomatie.gouv.fr",
          primary_email_status: EmailStatusCode.EMAIL_ACTIVE,
        });
        expect.fail("Should have thrown");
      } catch (e) {
        expect(e).to.be.instanceof(BusinessError);
      }
      expect(updateSetStub.called).to.be.false;
    });

    it("personal email: enqueues a mailbox job that activates the fiche, without invitation", async () => {
      const activation = await activateWith({
        primary_email_status: EmailStatusCode.EMAIL_ACTIVE,
      });

      expect(activation).to.equal("mailbox");
      expect(updateSetStub.firstCall.args[0].primary_email_status).to.equal(
        EmailStatusCode.EMAIL_CREATION_WAITING,
      );
      expect(bossSendStub.calledOnce).to.be.true;
      expect(bossSendStub.firstCall.args[1]).to.deep.equal({
        userUuid: USER_UUID,
        username: "ada.lovelace",
        onboarding: false,
      });
      expect(bossSendStub.firstCall.args[2].singletonKey).to.equal(
        `onboarding-mailbox-${USER_UUID}`,
      );
      expect(sendVerificationEmailStub.called).to.be.false;
    });

    it("personal email: puts the previous status back when the mailbox job cannot be enqueued", async () => {
      bossSendStub.rejects(new Error("pg-boss down"));

      try {
        await activateWith({
          primary_email_status: EmailStatusCode.EMAIL_ACTIVE,
        });
        expect.fail("Should have thrown");
      } catch (e: any) {
        expect(e.message).to.equal("pg-boss down");
      }

      expect(updateSetStub.calledTwice).to.be.true;
      expect(updateSetStub.secondCall.args[0].primary_email_status).to.equal(
        EmailStatusCode.EMAIL_ACTIVE,
      );
      expect(
        updateWhereStub.calledWith(
          "primary_email_status",
          "=",
          EmailStatusCode.EMAIL_CREATION_WAITING,
        ),
      ).to.be.true;
    });

    it("does nothing for a fiche with a login email, without contact email, or not accepted", async () => {
      expect(
        await activateWith({
          primary_email: "ada@interieur.gouv.fr",
          primary_email_status: EmailStatusCode.EMAIL_ACTIVE,
        }),
      ).to.be.null;
      expect(
        await activateWith({
          secondary_email: null,
          primary_email_status: EmailStatusCode.EMAIL_ACTIVE,
        }),
      ).to.be.null;
      for (const status of [
        EmailStatusCode.MEMBER_VALIDATION_WAITING,
        EmailStatusCode.EMAIL_CREATION_WAITING,
        EmailStatusCode.EMAIL_SUSPENDED,
      ]) {
        expect(await activateWith({ primary_email_status: status })).to.be.null;
      }
      expect(updateSetStub.called).to.be.false;
      expect(bossSendStub.called).to.be.false;
    });
  });
});
