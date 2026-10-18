import { expect } from "chai";

import { isMemberReadyToLogin } from "@/lib/auth/loginStatus";
import { EmailStatusCode } from "@/models/member";

const MAILBOX = "ada.lovelace.ext@beta.gouv.fr";

describe("isMemberReadyToLogin", () => {
  it("refuses a fiche waiting for the incubator validation, even with a primary email", () => {
    expect(
      isMemberReadyToLogin({
        primary_email_status: EmailStatusCode.MEMBER_VALIDATION_WAITING,
        primary_email: null,
      }),
    ).to.be.false;
    expect(
      isMemberReadyToLogin({
        primary_email_status: EmailStatusCode.MEMBER_VALIDATION_WAITING,
        primary_email: MAILBOX,
      }),
    ).to.be.false;
  });

  it("refuses a member whose mailbox is being created", () => {
    expect(
      isMemberReadyToLogin({
        primary_email_status: EmailStatusCode.EMAIL_CREATION_WAITING,
        primary_email: null,
      }),
    ).to.be.false;
  });

  it("refuses an accepted member whose onboarding has not started (no primary email)", () => {
    [
      EmailStatusCode.EMAIL_UNSET,
      EmailStatusCode.EMAIL_VERIFICATION_WAITING,
      null,
      undefined,
    ].forEach((primary_email_status) => {
      expect(
        isMemberReadyToLogin({ primary_email_status, primary_email: null }),
        String(primary_email_status),
      ).to.be.false;
    });
  });

  it("lets in a member invited to verify their fiche", () => {
    expect(
      isMemberReadyToLogin({
        primary_email_status: EmailStatusCode.EMAIL_VERIFICATION_WAITING,
        primary_email: MAILBOX,
      }),
    ).to.be.true;
  });

  it("lets in active and suspended members", () => {
    [EmailStatusCode.EMAIL_ACTIVE, EmailStatusCode.EMAIL_SUSPENDED].forEach(
      (primary_email_status) => {
        expect(
          isMemberReadyToLogin({ primary_email_status, primary_email: MAILBOX }),
          primary_email_status,
        ).to.be.true;
      },
    );
    // a suspended member may have lost their primary email
    expect(
      isMemberReadyToLogin({
        primary_email_status: EmailStatusCode.EMAIL_SUSPENDED,
        primary_email: null,
      }),
    ).to.be.true;
  });

  it("does not lock out legacy fiches in an older status", () => {
    [
      EmailStatusCode.EMAIL_ACTIVE_AND_PASSWORD_DEFINITION_PENDING,
      EmailStatusCode.EMAIL_REDIRECTION_ACTIVE,
      EmailStatusCode.EMAIL_CREATION_PENDING,
      EmailStatusCode.EMAIL_UNSET,
    ].forEach((primary_email_status) => {
      expect(
        isMemberReadyToLogin({
          primary_email_status,
          primary_email: "ada@interieur.gouv.fr",
        }),
        primary_email_status,
      ).to.be.true;
    });
  });
});
