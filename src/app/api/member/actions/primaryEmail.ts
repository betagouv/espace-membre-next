"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";

import {
  findUsersUsingEmail,
  LEGACY_EXT_DOMAIN,
  normalizeLoginEmail,
} from "@/lib/auth/findUsersByLoginEmail";
// legacy-email-login: remove with src/lib/auth/legacyEmailLogin
import { getLegacyEmailLoginException } from "@/lib/auth/legacyEmailLogin";
import {
  clearPendingPrimaryEmail,
  setPendingPrimaryEmail,
  validateNewPrimaryEmail,
} from "@/lib/auth/pendingPrimaryEmail";
import { assertMfaSession, isMfaSession } from "@/lib/auth/sessionMfa";
import { authOptions } from "@/lib/authoptions";
import { DIMAIL_MAILBOX_DOMAIN } from "@/lib/dimail/utils";
import {
  AuthorizationError,
  BusinessError,
  NoDataError,
  UnwrapPromise,
  withErrorHandling,
} from "@/lib/error";
import { addEvent } from "@/lib/events";
import { db } from "@/lib/kysely";
import { EventCode } from "@/models/actionEvent/actionEvent";
import config from "@/server/config";

const getContext = async (username: string) => {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) {
    throw new AuthorizationError();
  }
  const isSelf = session.user.id === username;
  const isAdmin = config.ESPACE_MEMBRE_ADMIN.includes(session.user.id);
  if (!isSelf && !isAdmin) {
    throw new AuthorizationError();
  }
  const user = await db
    .selectFrom("users")
    .select([
      "uuid",
      "username",
      "primary_email",
      "pending_primary_email",
      "pending_primary_email_expires_at",
      "pending_primary_email_requested_by",
    ])
    .where("username", "=", username)
    .executeTakeFirst();
  if (!user) {
    throw new NoDataError("Membre introuvable");
  }
  return { session, isSelf, isAdmin, user };
};

// Who may request a new primary email (it only becomes primary after a
// ProConnect + MFA login on it) :
// - the member, from a ProConnect + MFA session
// - the member, from a magic link session opened through a support exception,
//   when their current address is lost (no other way to log in)
// - an admin, from a ProConnect + MFA session, for someone else
const canRequestChange = async ({
  session,
  isSelf,
  isAdmin,
  user,
}: Awaited<ReturnType<typeof getContext>>) => {
  if (isMfaSession(session)) {
    return isSelf || isAdmin;
  }
  // legacy-email-login: remove with src/lib/auth/legacyEmailLogin
  return (
    isSelf &&
    session.user.provider === "email" &&
    !!(await getLegacyEmailLoginException(user.uuid))
  );
};

// the member's own Dimail addresses on the main domain : attached to them by
// Dimail, they become primary without a ProConnect verification
const getDimailAddresses = async (userUuid: string) =>
  (
    await db
      .selectFrom("dinum_emails")
      .select("email")
      .where("user_id", "=", userUuid)
      .where("email", "ilike", `%@${DIMAIL_MAILBOX_DOMAIN}`)
      .where("email", "not ilike", `%@${LEGACY_EXT_DOMAIN}`)
      .where((eb) =>
        eb.or([eb("status", "is", null), eb("status", "!=", "disabled")]),
      )
      .orderBy("email")
      .execute()
  ).map((row) => row.email.toLowerCase());

async function getPrimaryEmailSettings(username: string) {
  const context = await getContext(username);
  const { user, isSelf, session } = context;
  const primary = normalizeLoginEmail(user.primary_email);
  const pending =
    user.pending_primary_email &&
    user.pending_primary_email_expires_at &&
    user.pending_primary_email_expires_at > new Date()
      ? {
          email: user.pending_primary_email,
          expiresAt: user.pending_primary_email_expires_at,
          requestedBy: user.pending_primary_email_requested_by,
        }
      : null;
  return {
    primaryEmail: user.primary_email,
    pending,
    dimailAddresses: (await getDimailAddresses(user.uuid)).filter(
      (email) => email !== primary,
    ),
    canChooseDimail: isSelf && isMfaSession(session),
    canRequest: await canRequestChange(context),
  };
}

async function choosePrimaryEmailFromDimail(
  username: string,
  rawEmail: string,
) {
  const { session, isSelf, user } = await getContext(username);
  if (!isSelf) {
    throw new AuthorizationError();
  }
  assertMfaSession(session, "modifier l'email principal");
  const email = normalizeLoginEmail(rawEmail);
  if (!email || !(await getDimailAddresses(user.uuid)).includes(email)) {
    throw new BusinessError(
      "notDimailAddress",
      "Cette adresse n'est pas une de tes adresses @beta.gouv.fr.",
    );
  }
  const otherUsers = await findUsersUsingEmail(email, {
    excludeUserUuid: user.uuid,
  });
  if (otherUsers.length) {
    throw new BusinessError(
      "emailAlreadyUsed",
      `L'email ${email} est déjà utilisé par un autre membre.`,
    );
  }
  await db
    .updateTable("users")
    .set({
      primary_email: email,
      pending_primary_email: null,
      pending_primary_email_expires_at: null,
      pending_primary_email_requested_by: null,
    })
    .where("uuid", "=", user.uuid)
    .execute();
  await addEvent({
    action_code: EventCode.MEMBER_PRIMARY_EMAIL_UPDATED,
    created_by_username: session.user.id,
    action_on_username: username,
    action_metadata: {
      value: email,
      old_value: user.primary_email || undefined,
    },
  });
  revalidatePath("/community/[id]", "layout");
}

async function requestPrimaryEmailChange(username: string, rawEmail: string) {
  const context = await getContext(username);
  if (!(await canRequestChange(context))) {
    throw new BusinessError(
      "proConnectRequired",
      "Reconnecte-toi avec ProConnect pour modifier l'email principal.",
    );
  }
  // a member without a login address yet is not onboarded : a pending
  // address could never be confirmed (the login is refused as MemberNotReady)
  if (!context.user.primary_email) {
    throw new BusinessError(
      "memberNotOnboarded",
      "Cette fiche n'a pas encore d'adresse de connexion : son arrivée doit d'abord aboutir.",
    );
  }
  const email = await validateNewPrimaryEmail({
    userUuid: context.user.uuid,
    currentPrimaryEmail: context.user.primary_email,
    email: rawEmail,
  });
  const { expiresAt } = await setPendingPrimaryEmail({
    username,
    email,
    requestedBy: context.session.user.id,
  });
  revalidatePath("/community/[id]", "layout");
  return { email, expiresAt };
}

async function cancelPendingPrimaryEmail(username: string) {
  const context = await getContext(username);
  if (!(await canRequestChange(context))) {
    throw new BusinessError(
      "proConnectRequired",
      "Reconnecte-toi avec ProConnect pour modifier l'email principal.",
    );
  }
  await clearPendingPrimaryEmail(username);
  revalidatePath("/community/[id]", "layout");
}

export const safeGetPrimaryEmailSettings = withErrorHandling<
  UnwrapPromise<ReturnType<typeof getPrimaryEmailSettings>>,
  Parameters<typeof getPrimaryEmailSettings>
>(getPrimaryEmailSettings);

export const safeChoosePrimaryEmailFromDimail = withErrorHandling<
  UnwrapPromise<ReturnType<typeof choosePrimaryEmailFromDimail>>,
  Parameters<typeof choosePrimaryEmailFromDimail>
>(choosePrimaryEmailFromDimail);

export const safeRequestPrimaryEmailChange = withErrorHandling<
  UnwrapPromise<ReturnType<typeof requestPrimaryEmailChange>>,
  Parameters<typeof requestPrimaryEmailChange>
>(requestPrimaryEmailChange);

export const safeCancelPendingPrimaryEmail = withErrorHandling<
  UnwrapPromise<ReturnType<typeof cancelPendingPrimaryEmail>>,
  Parameters<typeof cancelPendingPrimaryEmail>
>(cancelPendingPrimaryEmail);
