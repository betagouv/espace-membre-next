import {
  findUsersUsingEmail,
  isLegacyExtEmail,
  normalizeLoginEmail,
} from "@/lib/auth/findUsersByLoginEmail";
import { addEvent } from "@/lib/events";
import { db } from "@/lib/kysely";
import { EventCode } from "@/models/actionEvent/actionEvent";

// A primary email on the legacy @ext.beta.gouv.fr domain cannot be used with
// ProConnect. When the member logs in with ProConnect + MFA through one of
// their own Dimail addresses on the main domain (their alias), that address
// becomes their primary email : it is known to ProConnect and attached to them
// by Dimail.
export const switchLegacyExtPrimaryEmail = async ({
  username,
  loginEmail,
}: {
  username: string;
  loginEmail: string | null | undefined;
}) => {
  const email = normalizeLoginEmail(loginEmail);
  if (!email || isLegacyExtEmail(email)) {
    return false;
  }
  const user = await db
    .selectFrom("users")
    .select(["uuid", "primary_email"])
    .where("username", "=", username)
    .executeTakeFirst();
  if (!user || !isLegacyExtEmail(user.primary_email)) {
    return false;
  }
  const ownAddress = await db
    .selectFrom("dinum_emails")
    .select("email")
    .where("user_id", "=", user.uuid)
    .where(({ eb, fn }) => eb(fn("lower", ["email"]), "=", email))
    .executeTakeFirst();
  if (!ownAddress) {
    return false;
  }
  const otherUsers = await findUsersUsingEmail(email, {
    excludeUserUuid: user.uuid,
  });
  if (otherUsers.length) {
    console.log(
      `ProConnect: login address of ${username} is also used by another member, primary email kept`,
    );
    return false;
  }
  const updated = await db
    .updateTable("users")
    .set({ primary_email: email })
    .where("uuid", "=", user.uuid)
    .where("primary_email", "=", user.primary_email)
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
  console.log(`ProConnect: legacy ext primary email of ${username} switched`);
  return true;
};
