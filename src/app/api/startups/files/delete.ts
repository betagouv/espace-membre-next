"use server";

import { getServerSession } from "next-auth";

import { canEditStartup } from "@/lib/canEditStartup";
import { db } from "@/lib/kysely";
import { authOptions } from "@/utils/authoptions";
import { AuthorizationError, BusinessError } from "@/utils/error";

export async function deleteFile({ uuid }: { uuid: string }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.id) {
    throw new AuthorizationError();
  }

  // Defense in depth: fetch the file's parent startup and verify the session
  // user has edit rights on it before allowing the (soft-)delete.
  const file = await db
    .selectFrom("startups_files")
    .select(["startup_id"])
    .where("uuid", "=", uuid)
    .where("deleted_at", "is", null)
    .executeTakeFirst();
  if (!file) {
    throw new BusinessError("fileNotFound", `File ${uuid} not found`);
  }
  if (!(await canEditStartup(session, file.startup_id))) {
    throw new AuthorizationError();
  }

  await db
    .updateTable("startups_files")
    .set({ deleted_by: session.user.uuid, deleted_at: new Date() })
    .where("uuid", "=", uuid)
    .executeTakeFirstOrThrow();
  return true;
}
