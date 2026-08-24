"use server";

import { getServerSession } from "next-auth";

import { canEditStartup } from "@/lib/canEditStartup";
import { db } from "@/lib/kysely";
import { AuthorizationError } from "@/lib/error";
import { authOptions } from "@/lib/authoptions";

export async function deleteFile({ uuid }: { uuid: string }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.id) {
    throw new AuthorizationError();
  }

  const file = await db
    .selectFrom("startups_files")
    .select("startup_id")
    .where("uuid", "=", uuid)
    .where("deleted_at", "is", null)
    .executeTakeFirst();

  if (!file) {
    throw new Error("File not found");
  }

  const canEdit = await canEditStartup(session, file.startup_id);
  if (!canEdit) {
    throw new AuthorizationError();
  }

  await db
    .updateTable("startups_files")
    .set({ deleted_by: session.user.uuid, deleted_at: new Date() })
    .where("uuid", "=", uuid)
    .executeTakeFirstOrThrow();
  return true;
}
