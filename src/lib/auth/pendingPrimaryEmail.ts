import {
  findUsersUsingEmail,
  isLegacyExtEmail,
  normalizeLoginEmail,
} from "@/lib/auth/findUsersByLoginEmail";
import { BusinessError } from "@/lib/error";
import { addEvent } from "@/lib/events";
import { db } from "@/lib/kysely";
import { isPublicServiceEmail } from "@/lib/utils";
import { EventCode } from "@/models/actionEvent/actionEvent";

// a new primary email stays pending until a ProConnect + MFA login with it
// proves ownership
export const PENDING_PRIMARY_EMAIL_DAYS = 7;

export const findUsersByPendingPrimaryEmail = async (
  email: string | null | undefined,
) => {
  const normalized = normalizeLoginEmail(email);
  if (!normalized) {
    return [];
  }
  return db
    .selectFrom("users")
    .selectAll()
    .where(({ eb, fn }) =>
      eb(fn("lower", ["pending_primary_email"]), "=", normalized),
    )
    .where("pending_primary_email_expires_at", ">", new Date())
    .limit(2)
    .execute();
};

export const validateNewPrimaryEmail = async ({
  userUuid,
  currentPrimaryEmail,
  email: rawEmail,
}: {
  userUuid: string;
  currentPrimaryEmail: string | null;
  email: string;
}) => {
  const email = normalizeLoginEmail(rawEmail);
  if (!email) {
    throw new BusinessError(
      "invalidEmail",
      "L'email renseigné n'est pas valide.",
    );
  }
  if (email === normalizeLoginEmail(currentPrimaryEmail)) {
    throw new BusinessError(
      "samePrimaryEmail",
      "Cette adresse est déjà l'email principal.",
    );
  }
  // checked before isPublicServiceEmail, which accepts every *.gouv.fr domain
  if (isLegacyExtEmail(email)) {
    throw new BusinessError(
      "extEmailNotAllowed",
      "Les adresses @ext.beta.gouv.fr ne permettent pas de se connecter avec ProConnect.",
    );
  }
  if (!(await isPublicServiceEmail(email))) {
    throw new BusinessError(
      "notPublicServiceEmail",
      "L'email principal doit être une adresse d'agent public.",
    );
  }
  const otherUsers = await findUsersUsingEmail(email, {
    excludeUserUuid: userUuid,
  });
  if (otherUsers.length) {
    throw new BusinessError(
      "emailAlreadyUsed",
      `L'email ${email} est déjà utilisé par un autre membre.`,
    );
  }
  return email;
};

export const setPendingPrimaryEmail = async ({
  username,
  email,
  requestedBy,
}: {
  username: string;
  email: string;
  requestedBy: string;
}) => {
  const expiresAt = new Date(
    Date.now() + PENDING_PRIMARY_EMAIL_DAYS * 24 * 3600 * 1000,
  );
  await db
    .updateTable("users")
    .set({
      pending_primary_email: email,
      pending_primary_email_expires_at: expiresAt,
      pending_primary_email_requested_by: requestedBy,
    })
    .where("username", "=", username)
    .execute();
  await addEvent({
    action_code: EventCode.MEMBER_PRIMARY_EMAIL_CHANGE_REQUESTED,
    created_by_username: requestedBy,
    action_on_username: username,
    action_metadata: { value: email },
  });
  return { expiresAt };
};

export const clearPendingPrimaryEmail = (username: string) =>
  db
    .updateTable("users")
    .set({
      pending_primary_email: null,
      pending_primary_email_expires_at: null,
      pending_primary_email_requested_by: null,
    })
    .where("username", "=", username)
    .execute();

export const promotePendingPrimaryEmail = async ({
  username,
  loginEmail,
}: {
  username: string;
  loginEmail: string | null | undefined;
}) => {
  const email = normalizeLoginEmail(loginEmail);
  if (!email) {
    return false;
  }
  const user = await db
    .selectFrom("users")
    .select([
      "uuid",
      "primary_email",
      "secondary_email",
      "pending_primary_email",
      "pending_primary_email_expires_at",
    ])
    .where("username", "=", username)
    .executeTakeFirst();
  if (
    !user ||
    normalizeLoginEmail(user.pending_primary_email) !== email ||
    !user.pending_primary_email_expires_at ||
    user.pending_primary_email_expires_at <= new Date()
  ) {
    return false;
  }
  // the address may have been taken by someone else since the request
  const otherUsers = await findUsersUsingEmail(email, {
    excludeUserUuid: user.uuid,
  });
  if (otherUsers.length) {
    console.log(
      `ProConnect: pending primary email of ${username} is now used by another member, kept pending`,
    );
    return false;
  }
  // the personal email confirmed as primary : the two are swapped, so that the
  // same address is never kept twice
  const swapWithSecondary = normalizeLoginEmail(user.secondary_email) === email;
  // conditional on the request still standing : it may have been cancelled or
  // replaced while this login was going on
  const updated = await db
    .updateTable("users")
    .set({
      primary_email: email,
      ...(swapWithSecondary ? { secondary_email: user.primary_email } : {}),
      pending_primary_email: null,
      pending_primary_email_expires_at: null,
      pending_primary_email_requested_by: null,
    })
    .where("uuid", "=", user.uuid)
    .where("pending_primary_email", "=", user.pending_primary_email)
    .where("pending_primary_email_expires_at", ">", new Date())
    .executeTakeFirst();
  if (!Number(updated.numUpdatedRows)) {
    return false;
  }
  await addEvent({
    action_code: EventCode.MEMBER_PRIMARY_EMAIL_UPDATED,
    created_by_username: username,
    action_on_username: username,
    action_metadata: {
      value: email,
      old_value: user.primary_email || undefined,
    },
  });
  if (swapWithSecondary && user.primary_email) {
    await addEvent({
      action_code: EventCode.MEMBER_SECONDARY_EMAIL_UPDATED,
      created_by_username: username,
      action_on_username: username,
      action_metadata: {
        value: user.primary_email,
        old_value: email,
      },
    });
  }
  console.log(`ProConnect: pending primary email of ${username} confirmed`);
  return true;
};
