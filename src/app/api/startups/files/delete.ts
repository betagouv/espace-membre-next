"use server";

import { canEditStartupInfo, requireAuthSubject } from "@/lib/authorization";
import { AuthorizationError, NoDataError } from "@/lib/error";
import { db } from "@/lib/kysely";

export async function deleteFile({ uuid }: { uuid: string }) {
  const subject = await requireAuthSubject();
  const file = await db
    .selectFrom("startups_files")
    .select("startup_id")
    .where("uuid", "=", uuid)
    .where("deleted_at", "is", null)
    .executeTakeFirst();
  if (!file) {
    throw new NoDataError("Document introuvable");
  }
  if (!(await canEditStartupInfo(subject, file.startup_id))) {
    throw new AuthorizationError();
  }
  await db
    .updateTable("startups_files")
    .set({ deleted_by: subject.uuid, deleted_at: new Date() })
    .where("uuid", "=", uuid)
    .executeTakeFirstOrThrow();
  return true;
}
