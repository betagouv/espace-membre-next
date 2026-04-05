"use server";
import { getServerSession } from "next-auth/next";

import {
  smtpBlockedContactsEmailDelete,
  unblacklistContactEmail,
} from "@/server/config/email.config";
import { authOptions } from "@/utils/authoptions";
import { AuthorizationError, UnwrapPromise, withErrorHandling } from "@/utils/error";

export async function unblockMemberEmailAddress(email: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session?.user?.isAdmin) {
    throw new AuthorizationError();
  }
  const res = await smtpBlockedContactsEmailDelete({
    email,
  });

  return res;
}

export const safeUnblockMemberEmailAddress = withErrorHandling<
  UnwrapPromise<ReturnType<typeof unblockMemberEmailAddress>>,
  Parameters<typeof unblockMemberEmailAddress>
>(unblockMemberEmailAddress);

export async function unblockMemberEmailAddressFromCampaign(email: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session?.user?.isAdmin) {
    throw new AuthorizationError();
  }

  const res = await unblacklistContactEmail({
    email,
  });

  return res;
}

export const safeUnblockMemberEmailAddressFromCampaign = withErrorHandling<
  UnwrapPromise<ReturnType<typeof unblockMemberEmailAddressFromCampaign>>,
  Parameters<typeof unblockMemberEmailAddressFromCampaign>
>(unblockMemberEmailAddressFromCampaign);
