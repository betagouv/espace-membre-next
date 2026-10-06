import { EmailStatusCode } from "@/models/member";

// a member can be matched at login through a Dimail address linked to them by
// username (see sync-dinum-emails), before their own onboarding is done. A
// fiche that is not validated yet, or whose login address is not ready, must
// not be entered that way.
//
// refused :
//  - MEMBER_VALIDATION_WAITING : the incubator has not validated the fiche
//  - EMAIL_CREATION_WAITING : the mailbox is being created
//  - no primary email with EMAIL_UNSET (accepted, onboarding not started), with
//    the legacy EMAIL_VERIFICATION_WAITING (accepted before the mailbox was
//    created at validation) or with no status at all
//
// every other status logs in, EMAIL_SUSPENDED included (the expired-mission
// check is done separately) : older statuses still exist on legacy fiches.
export const isMemberReadyToLogin = ({
  primary_email_status,
  primary_email,
}: {
  primary_email_status?: string | null;
  primary_email?: string | null;
}) => {
  if (
    primary_email_status === EmailStatusCode.MEMBER_VALIDATION_WAITING ||
    primary_email_status === EmailStatusCode.EMAIL_CREATION_WAITING
  ) {
    return false;
  }
  if (
    !primary_email &&
    (!primary_email_status ||
      primary_email_status === EmailStatusCode.EMAIL_UNSET ||
      primary_email_status === EmailStatusCode.EMAIL_VERIFICATION_WAITING)
  ) {
    return false;
  }
  return true;
};
