"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/authoptions";
import { AuthorizationError, withErrorHandling } from "@/utils/error";
import { getUserBasicInfo } from "@/lib/kysely/queries/users";
import { memberBaseInfoToModel } from "@/models/mapper";
import {
  getDimailUsernameForUser,
  DIMAIL_MAILBOX_DOMAIN,
} from "@/lib/dimail/utils";

// return expected dimail email for current user
export const getDimailEmail = withErrorHandling(async () => {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.id) {
    throw new AuthorizationError();
  }
  const dbUser = await getUserBasicInfo({ uuid: session.user.uuid });
  if (!dbUser) {
    throw new Error(`User ${session.user.uuid} not found`);
  }
  const user = memberBaseInfoToModel(dbUser);
  const username = getDimailUsernameForUser(user.username, user.legal_status);
  return `${username}@${DIMAIL_MAILBOX_DOMAIN}`;
});
