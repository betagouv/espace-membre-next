"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";

import { addEvent } from "@/lib/events";
import { db } from "@/lib/kysely";
import * as mattermost from "@/lib/mattermost";
import { EventCode } from "@/models/actionEvent/actionEvent";
import betagouv from "@/server/betagouv";
import config from "@/server/config";
import {
  isPublicServiceEmail,
  isAdminEmail,
  userInfos,
} from "@/server/controllers/utils";
import { authOptions } from "@/utils/authoptions";
import {
  AuthorizationError,
  UnwrapPromise,
  withErrorHandling,
  AdminEmailNotAllowedError,
  BusinessError,
} from "@/utils/error";

export async function managePrimaryEmailForUser({
  username,
  primaryEmail,
}: {
  username: string;
  primaryEmail: string;
}): Promise<void> {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.id) {
    throw new AuthorizationError();
  }
  const isCurrentUser = session?.user.id === username;
  const user = await userInfos({ username }, isCurrentUser);
  if (!user.authorizations.canChangeEmails && !session.user.isAdmin) {
    throw new AuthorizationError();
  }
  const primaryEmailIsPublicServiceEmail =
    await isPublicServiceEmail(primaryEmail);
  if (!primaryEmailIsPublicServiceEmail) {
    throw new BusinessError(
      `L'email renseigné n'est pas un email de service public`,
    );
  }
  if (isAdminEmail(primaryEmail)) {
    throw new AdminEmailNotAllowedError();
  }

  await db
    .updateTable("users")
    .where("username", "=", username)
    .set({
      primary_email: primaryEmail,
    })
    .execute();

  await addEvent({
    action_code: EventCode.MEMBER_PRIMARY_EMAIL_UPDATED,
    created_by_username: session.user.id,
    action_on_username: username,
    action_metadata: {
      value: primaryEmail,
      old_value: user ? user.userInfos.primary_email || undefined : undefined,
    },
  });

  console.log(`${session?.user.id} a mis à jour son adresse mail primaire.`);
  revalidatePath("/community/[id]", "layout");
  return;
}

export const safeManagePrimaryEmailForUser = withErrorHandling<
  UnwrapPromise<ReturnType<typeof managePrimaryEmailForUser>>,
  Parameters<typeof managePrimaryEmailForUser>
>(managePrimaryEmailForUser);
