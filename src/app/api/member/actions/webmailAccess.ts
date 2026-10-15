"use server";

import { getServerSession } from "next-auth/next";

import { assertMfaSession } from "@/lib/auth/sessionMfa";
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
import { sendWebmailAccessCode } from "@/server/queueing/workers/create-dimail-mailbox";
import { getUserNameFromEmail } from "@/server/queueing/workers/sync-dinum-emails";
import { getUserInfos } from "@/lib/kysely/queries/users";
import { checkUserIsExpired } from "@/lib/utils";
import { memberBaseInfoToModel } from "@/models/mapper";

// one link per member at a time : each one stays valid until it expires
const MIN_MINUTES_BETWEEN_SENDS = 5;

// The member's mailbox. The sync attaches mailboxes by username or primary
// email, which can pick a namesake : the mailbox must be the primary email,
// the destination of the primary alias, or carry the member's username.
const getMemberMailbox = async (user: {
  uuid: string;
  username: string;
  primary_email: string | null;
}) => {
  const rows = await db
    .selectFrom("dinum_emails")
    .select(["email", "type", "status", "destination"])
    .where("user_id", "=", user.uuid)
    .where((eb) =>
      eb.or([eb("status", "is", null), eb("status", "!=", "deleted")]),
    )
    .execute();
  const primary = user.primary_email?.toLowerCase();
  const primaryAlias = rows.find(
    (row) => row.type === "alias" && row.email.toLowerCase() === primary,
  );
  const candidates = rows
    .filter((row) => row.type === "mailbox")
    .filter(
      (row) =>
        row.email.toLowerCase() === primary ||
        row.email.toLowerCase() === primaryAlias?.destination?.toLowerCase() ||
        getUserNameFromEmail(row.email.toLowerCase()) === user.username,
    )
    .sort(
      (a, b) =>
        Number(!a.email.endsWith(`@${DIMAIL_MAILBOX_DOMAIN}`)) -
          Number(!b.email.endsWith(`@${DIMAIL_MAILBOX_DOMAIN}`)) ||
        a.email.localeCompare(b.email),
    );
  return candidates[0] ?? null;
};

const getContext = async (username: string) => {
  const session = await getServerSession(authOptions);
  if (
    !session?.user.id ||
    !config.ESPACE_MEMBRE_ADMIN.includes(session.user.id)
  ) {
    throw new AuthorizationError();
  }
  const user = await db
    .selectFrom("users")
    .select(["uuid", "username", "primary_email", "secondary_email"])
    .where("username", "=", username)
    .executeTakeFirst();
  if (!user) {
    throw new NoDataError("Membre introuvable");
  }
  return { session, user };
};

async function getWebmailAccessTarget(username: string) {
  const { user } = await getContext(username);
  return {
    mailbox: (await getMemberMailbox(user))?.email ?? null,
    secondaryEmail: user.secondary_email,
  };
}

// A new member's webmail access code (3 uses) is only sent once, at creation :
// when it is lost or used up, the support sends a new one to the personal
// email. It gives access to the mailbox, hence the MFA requirement.
// expectedSecondaryEmail is the address the admin confirmed : it is checked
// again here, the member may have changed it since the page was loaded
async function resendWebmailAccess(
  username: string,
  expectedSecondaryEmail: string,
) {
  const { session, user } = await getContext(username);
  assertMfaSession(session, "renvoyer un accès au webmail");
  const mailbox = await getMemberMailbox(user);
  if (!mailbox) {
    throw new BusinessError(
      "noMailbox",
      "Ce membre n'a pas de boîte Dimail reliée à sa fiche.",
    );
  }
  if (mailbox.status === "disabled") {
    throw new BusinessError(
      "disabledMailbox",
      `La boîte ${mailbox.email} est désactivée : elle doit d'abord être réactivée.`,
    );
  }
  if (!user.secondary_email) {
    throw new BusinessError(
      "noSecondaryEmail",
      "Ce membre n'a pas d'email secondaire où envoyer le lien.",
    );
  }
  if (
    user.secondary_email.trim().toLowerCase() !==
    expectedSecondaryEmail.trim().toLowerCase()
  ) {
    throw new BusinessError(
      "secondaryEmailChanged",
      `L'email secondaire de ce membre a changé (${user.secondary_email}) : recharge la page pour vérifier la nouvelle adresse.`,
    );
  }
  const dbUser = await getUserInfos({
    username,
    options: { withDetails: true },
  });
  if (!dbUser || checkUserIsExpired(memberBaseInfoToModel(dbUser), 5)) {
    throw new BusinessError(
      "expiredMember",
      "Ce membre n'a plus de mission en cours.",
    );
  }
  const recentSend = await db
    .selectFrom("events")
    .select("created_at")
    .where("action_on_username", "=", username)
    .where("action_code", "=", EventCode.MEMBER_WEBMAIL_ACCESS_SENT)
    .where(
      "created_at",
      ">",
      new Date(Date.now() - MIN_MINUTES_BETWEEN_SENDS * 60 * 1000),
    )
    .executeTakeFirst();
  if (recentSend) {
    throw new BusinessError(
      "tooManySends",
      `Un lien a déjà été envoyé il y a moins de ${MIN_MINUTES_BETWEEN_SENDS} minutes.`,
    );
  }
  await sendWebmailAccessCode({
    mailboxEmail: mailbox.email,
    toEmail: user.secondary_email,
    resend: true,
  });
  await addEvent({
    action_code: EventCode.MEMBER_WEBMAIL_ACCESS_SENT,
    created_by_username: session.user.id,
    action_on_username: username,
    action_metadata: { value: mailbox.email, sentTo: user.secondary_email },
  });
  return { mailbox: mailbox.email, sentTo: user.secondary_email };
}

export const safeGetWebmailAccessTarget = withErrorHandling<
  UnwrapPromise<ReturnType<typeof getWebmailAccessTarget>>,
  Parameters<typeof getWebmailAccessTarget>
>(getWebmailAccessTarget);

export const safeResendWebmailAccess = withErrorHandling<
  UnwrapPromise<ReturnType<typeof resendWebmailAccess>>,
  Parameters<typeof resendWebmailAccess>
>(resendWebmailAccess);
