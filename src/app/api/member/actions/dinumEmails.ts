"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";

import { normalizeLoginEmail } from "@/lib/auth/findUsersByLoginEmail";
import { authOptions } from "@/lib/authoptions";
import { assertMfaSession } from "@/lib/auth/sessionMfa";
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

const getAdminContext = async (username: string) => {
  const session = await getServerSession(authOptions);
  if (
    !session?.user.id ||
    !config.ESPACE_MEMBRE_ADMIN.includes(session.user.id)
  ) {
    throw new AuthorizationError();
  }
  // an attached address logs into the account
  assertMfaSession(session, "rattacher une adresse Dimail");
  const user = await db
    .selectFrom("users")
    .select("uuid")
    .where("username", "=", username)
    .executeTakeFirst();
  if (!user) {
    throw new NoDataError("Membre introuvable");
  }
  return { adminUsername: session.user.id, userUuid: user.uuid };
};

async function getMemberDinumEmails(username: string) {
  const { userUuid } = await getAdminContext(username);
  return db
    .selectFrom("dinum_emails")
    .select(["email", "type", "status", "destination", "user_id_locked_by"])
    .where("user_id", "=", userUuid)
    .orderBy("type")
    .orderBy("email")
    .execute();
}

// moving an address from another member needs confirmMove: it logs into that account
async function attachDinumEmailToMember(
  username: string,
  rawEmail: string,
  { confirmMove = false }: { confirmMove?: boolean } = {},
) {
  const { adminUsername, userUuid } = await getAdminContext(username);
  const email = normalizeLoginEmail(rawEmail);
  const row =
    email &&
    (await db
      .selectFrom("dinum_emails")
      .leftJoin("users", "users.uuid", "dinum_emails.user_id")
      .select(["dinum_emails.email", "dinum_emails.user_id", "users.username"])
      .where(({ eb, fn }) =>
        eb(fn("lower", ["dinum_emails.email"]), "=", email),
      )
      .executeTakeFirst());
  if (!row) {
    throw new BusinessError(
      "unknownDinumEmail",
      "Cette adresse n'existe pas dans Dimail (ou n'a pas encore été synchronisée).",
    );
  }
  // two members matching the same address would both be refused at login
  const emailOwner = await db
    .selectFrom("users")
    .select("username")
    .where("uuid", "!=", userUuid)
    .where(({ eb, fn }) =>
      eb.or([
        eb(fn("lower", ["primary_email"]), "=", row.email.toLowerCase()),
        eb(fn("lower", ["secondary_email"]), "=", row.email.toLowerCase()),
        eb(
          fn("lower", ["pending_primary_email"]),
          "=",
          row.email.toLowerCase(),
        ).and("pending_primary_email_expires_at", ">", new Date()),
      ]),
    )
    .executeTakeFirst();
  if (emailOwner) {
    throw new BusinessError(
      "dinumEmailUsedByAnotherMember",
      `Cette adresse est l'email principal, secondaire ou en attente de la fiche ${emailOwner.username}. Changez d'abord l'adresse de cette fiche.`,
    );
  }
  const previousOwner =
    row.user_id && row.user_id !== userUuid ? row.username : null;
  if (previousOwner && !confirmMove) {
    return { attached: false, currentOwner: previousOwner };
  }
  await db
    .updateTable("dinum_emails")
    .set({
      user_id: userUuid,
      user_id_locked_by: adminUsername,
      user_id_locked_at: new Date(),
    })
    .where("email", "=", row.email)
    .execute();
  await addEvent({
    action_code: EventCode.MEMBER_DINUM_EMAIL_ATTACHMENT_UPDATED,
    created_by_username: adminUsername,
    action_on_username: username,
    action_metadata: { value: row.email, attached: true },
  });
  if (previousOwner) {
    await addEvent({
      action_code: EventCode.MEMBER_DINUM_EMAIL_ATTACHMENT_UPDATED,
      created_by_username: adminUsername,
      action_on_username: previousOwner,
      action_metadata: { value: row.email, attached: false },
    });
  }
  revalidatePath("/community/[id]", "layout");
  return { attached: true, currentOwner: null };
}

// the address goes back to the sync, which attaches it again on its next run
async function releaseDinumEmail(username: string, rawEmail: string) {
  const { adminUsername, userUuid } = await getAdminContext(username);
  const email = normalizeLoginEmail(rawEmail);
  const updated =
    email &&
    (await db
      .updateTable("dinum_emails")
      .set({ user_id_locked_by: null, user_id_locked_at: null })
      .where("user_id", "=", userUuid)
      .where(({ eb, fn }) => eb(fn("lower", ["email"]), "=", email))
      .where("user_id_locked_by", "is not", null)
      .returning("email")
      .executeTakeFirst());
  if (!updated) {
    throw new BusinessError(
      "notLockedDinumEmail",
      "Cette adresse n'a pas été rattachée à la main à cette fiche.",
    );
  }
  await addEvent({
    action_code: EventCode.MEMBER_DINUM_EMAIL_ATTACHMENT_UPDATED,
    created_by_username: adminUsername,
    action_on_username: username,
    action_metadata: { value: updated.email, attached: false },
  });
  revalidatePath("/community/[id]", "layout");
}

export const safeGetMemberDinumEmails = withErrorHandling<
  UnwrapPromise<ReturnType<typeof getMemberDinumEmails>>,
  Parameters<typeof getMemberDinumEmails>
>(getMemberDinumEmails);

export const safeAttachDinumEmailToMember = withErrorHandling<
  UnwrapPromise<ReturnType<typeof attachDinumEmailToMember>>,
  Parameters<typeof attachDinumEmailToMember>
>(attachDinumEmailToMember);

export const safeReleaseDinumEmail = withErrorHandling<
  UnwrapPromise<ReturnType<typeof releaseDinumEmail>>,
  Parameters<typeof releaseDinumEmail>
>(releaseDinumEmail);
