"use server";

import { getServerSession } from "next-auth";

import { updateMember } from "../updateMember";
import {
  memberValidateInfoSchema,
  memberValidateInfoSchemaType,
} from "@/models/actions/member";
import { EmailStatusCode } from "@/models/member";
import { isPublicServiceEmail, isAdminEmail } from "@/lib/utils";
import { authOptions } from "@/lib/authoptions";
import { getUserBasicInfo } from "@/lib/kysely/queries/users";
import { AdminEmailNotAllowedError, BusinessError } from "@/lib/error";

// when the user verifies its membership (from AccountVerifyClientPage)
// the email account (mailbox or public service email) has already been set up
// at invitation/validation : this only saves the profile and activates the account
export async function verifyNewMember(
  memberData: memberValidateInfoSchemaType & { username: string },
): Promise<{ success: boolean; message: string }> {
  const session = await getServerSession(authOptions);

  if (!session || session.user.id !== memberData.username) {
    throw new Error(`You don't have the right to access this function`);
  }
  const data = memberValidateInfoSchema.parse(memberData);

  const dbUser = await getUserBasicInfo({ uuid: session.user.uuid });
  if (
    !dbUser ||
    dbUser.primary_email_status !== EmailStatusCode.EMAIL_VERIFICATION_WAITING
  ) {
    throw new BusinessError(
      "userAlreadyVerified",
      "Ta fiche a déjà été vérifiée.",
    );
  }

  if (
    data.secondary_email &&
    (await isPublicServiceEmail(data.secondary_email)) &&
    isAdminEmail(data.secondary_email)
  ) {
    throw new AdminEmailNotAllowedError();
  }

  await updateMember(
    data,
    session.user.uuid,
    {
      primary_email_status: EmailStatusCode.EMAIL_ACTIVE,
      primary_email_status_updated_at: new Date(),
    },
    session.user.id,
  );

  return {
    success: true,
    message: "L'utilisateur a bien été vérifié",
  };
}
