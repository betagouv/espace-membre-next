"use server";

import { ExpressionWrapper } from "kysely";
import { getServerSession } from "next-auth";

import { db } from "@/lib/kysely";
import { getUserStartupsActive } from "@/lib/kysely/queries/users";
import { authOptions } from "@/utils/authoptions";
import { AuthorizationError, UnwrapPromise, withErrorHandling } from "@/utils/error";

const commonFileFields = [
  "startups_files.filename",
  "startups_files.title",
  "startups_files.uuid",
  "startups_files.size",
  "startups_files.comments",
  "startups_files.created_at",
  "startups_files.type",
  "startups_files.data",
  "startups.name as startup",
  "startups.uuid as startup_uuid",
] as const;

export async function getStartupFiles({
  ghid,
  uuid,
}: {
  ghid?: string;
  uuid?: string;
} = {}) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.id) {
    throw new AuthorizationError();
  }

  // verify user has active mission on this startup or is admin
  if (!session.user.isAdmin) {
    const userStartups = await getUserStartupsActive(session.user.uuid);
    const startupId = uuid || null;
    const hasAccess = startupId
      ? userStartups.some((s) => s.uuid === startupId)
      : false;
    if (!hasAccess) {
      throw new AuthorizationError();
    }
  }
  const files = await db
    .selectFrom(["startups", "startups_files"])
    .select(commonFileFields)
    .where((eb) => {
      const conditions: ExpressionWrapper<any, any, any>[] = [];
      conditions.push(
        eb("startups.uuid", "=", eb.ref("startups_files.startup_id")),
      );
      conditions.push(eb("startups_files.deleted_at", "is", null));
      if (ghid) conditions.push(eb("startups.ghid", "=", ghid));
      if (uuid) conditions.push(eb("startups.uuid", "=", uuid));
      return eb.and(conditions);
    })
    .orderBy("created_at", "desc")
    .execute();
  return files;
}

export const safeGetStartupFiles = withErrorHandling<
  UnwrapPromise<ReturnType<typeof getStartupFiles>>,
  Parameters<typeof getStartupFiles>
>(getStartupFiles);
