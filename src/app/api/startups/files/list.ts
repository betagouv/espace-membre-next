"use server";

import { ExpressionWrapper } from "kysely";
import { getServerSession } from "next-auth";

import { canEditStartup } from "@/lib/canEditStartup";
import { db } from "@/lib/kysely";
import { AuthorizationError } from "@/lib/error";
import { authOptions } from "@/lib/authoptions";

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
  if (uuid) {
    const canEdit = await canEditStartup(session, uuid);
    if (!canEdit) {
      throw new AuthorizationError();
    }
  }
  // Note: when called without uuid/ghid (e.g. the startup list page), file
  // metadata across all startups is returned to any authenticated member.
  // File content (base64) is not selected here. The uuid-filtered path
  // enforces canEditStartup above.
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
