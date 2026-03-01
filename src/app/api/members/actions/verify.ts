"use server";

import { getServerSession } from "next-auth";

import { addEvent } from "@/lib/events";
import { db } from "@/lib/kysely";
import { EventCode } from "@/models/actionEvent/actionEvent";
import { authOptions } from "@/utils/authoptions";
import { getUserBasicInfo } from "@/lib/kysely/queries/users";
import { EmailStatusCode } from "@/models/member";
import { canEditMember } from "@/lib/canEditMember";

export async function verify({ uuid }: { uuid: string }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.id) {
    throw new Error(`You don't have the right to access this function`);
  }
  const isCurrentUser = session.user.id === uuid;
  const canEdit = await canEditMember({
    memberUuid: uuid,
    sessionUser: session.user,
  });
  const canVerifyMember = isCurrentUser || canEdit;
  if (!canVerifyMember) return false;

  const user = await getUserBasicInfo({ uuid });
  if (!user) return false;

  db.updateTable("users")
    .set("primary_email_status", EmailStatusCode.EMAIL_ACTIVE)
    .where("uuid", "=", uuid)
    .executeTakeFirst();

  await addEvent({
    action_code: EventCode.MEMBER_VERIFIED,
    created_by_username: session.user.id,
    action_on_username: user.username,
  });
  return true;
}
