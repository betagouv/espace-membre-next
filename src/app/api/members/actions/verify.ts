"use server";

import slugify from "@sindresorhus/slugify";
import _, { trimEnd } from "lodash";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { addEvent } from "@/lib/events";
import { db } from "@/lib/kysely";
import { EventCode } from "@/models/actionEvent/actionEvent";
import { teamUpdateSchema, teamUpdateSchemaType } from "@/models/actions/team";
import { authOptions } from "@/utils/authoptions";
import { isSessionUserIncubatorTeamAdminForUser } from "@/server/config/admin.config";
import { userInfos } from "@/server/controllers/utils";
import { getUserBasicInfo } from "@/lib/kysely/queries/users";
import { STATUS_CODES } from "http";
import { EMAIL_STATUS_READABLE_FORMAT } from "@/models/misc";
import { EMAIL_CONFIG } from "@/server/config/email.config";
import { EmailStatusCode } from "@/models/member";

export async function verify({ uuid }: { uuid: string }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.id) {
    throw new Error(`You don't have the right to access this function`);
  }
  const user = await getUserBasicInfo({ uuid });
  if (!user) return false;
  const sessionUserIsFromIncubatorTeam =
    await isSessionUserIncubatorTeamAdminForUser({
      user,
      sessionUserUuid: session.user.uuid,
    });
  const isCurrentUser = session.user.id === uuid;
  const canVerifyMember =
    isCurrentUser || sessionUserIsFromIncubatorTeam || session.user.isAdmin;
  console.log("canVerifyMember", {
    isCurrentUser,
    sessionUserIsFromIncubatorTeam,
    isAdmin: session.user.isAdmin,
  });
  if (!canVerifyMember) return false;
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
