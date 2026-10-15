"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";

import { assertMfaSession } from "@/lib/auth/sessionMfa";
import { authOptions } from "@/lib/authoptions";
import {
  AuthorizationError,
  BusinessError,
  NoDataError,
  UnwrapPromise,
  withErrorHandling,
} from "@/lib/error";
import { db } from "@/lib/kysely";
import config from "@/server/config";

import { getLegacyEmailLoginConfig } from "./config";
import { EXCEPTION_EVENT, getLegacyEmailLoginException } from "./eligibility";

const MAX_EXCEPTION_DAYS = 30;

// granting exceptions reopens the email login, which bypasses the MFA : it
// requires an admin who logged in with ProConnect + MFA
const getUserUuidAsAdmin = async (username: string) => {
  const session = await getServerSession(authOptions);
  if (
    !session?.user.id ||
    !config.ESPACE_MEMBRE_ADMIN.includes(session.user.id)
  ) {
    throw new AuthorizationError();
  }
  assertMfaSession(session, "gérer les autorisations de connexion par email");
  const user = await db
    .selectFrom("users")
    .select("uuid")
    .where("username", "=", username)
    .executeTakeFirst();
  if (!user) {
    throw new NoDataError("Membre introuvable");
  }
  return user.uuid;
};

async function allowLegacyEmailLogin(username: string, days: number) {
  if (!Number.isInteger(days) || days < 1 || days > MAX_EXCEPTION_DAYS) {
    throw new BusinessError(
      "invalidDuration",
      `La durée doit être comprise entre 1 et ${MAX_EXCEPTION_DAYS} jours.`,
    );
  }
  if (getLegacyEmailLoginConfig().mode === "off") {
    throw new BusinessError(
      "emailLoginOff",
      "La connexion par email est définitivement coupée.",
    );
  }
  const userUuid = await getUserUuidAsAdmin(username);
  const until = new Date(Date.now() + days * 24 * 3600 * 1000);
  await db
    .insertInto("user_events")
    .values({ field_id: EXCEPTION_EVENT, user_id: userUuid, date: until })
    .onConflict((oc) =>
      oc.column("field_id").column("user_id").doUpdateSet({ date: until }),
    )
    .execute();
  revalidatePath(`/community/${username}`);
  return { until };
}

async function revokeLegacyEmailLogin(username: string) {
  const userUuid = await getUserUuidAsAdmin(username);
  await db
    .deleteFrom("user_events")
    .where("user_id", "=", userUuid)
    .where("field_id", "=", EXCEPTION_EVENT)
    .execute();
  revalidatePath(`/community/${username}`);
}

async function getLegacyEmailLoginStatus(username: string) {
  const userUuid = await getUserUuidAsAdmin(username);
  return {
    mode: getLegacyEmailLoginConfig().mode,
    exceptionUntil: await getLegacyEmailLoginException(userUuid),
  };
}

export const safeGetLegacyEmailLoginStatus = withErrorHandling<
  UnwrapPromise<ReturnType<typeof getLegacyEmailLoginStatus>>,
  Parameters<typeof getLegacyEmailLoginStatus>
>(getLegacyEmailLoginStatus);

export const safeAllowLegacyEmailLogin = withErrorHandling<
  UnwrapPromise<ReturnType<typeof allowLegacyEmailLogin>>,
  Parameters<typeof allowLegacyEmailLogin>
>(allowLegacyEmailLogin);

export const safeRevokeLegacyEmailLogin = withErrorHandling<
  UnwrapPromise<ReturnType<typeof revokeLegacyEmailLogin>>,
  Parameters<typeof revokeLegacyEmailLogin>
>(revokeLegacyEmailLogin);
