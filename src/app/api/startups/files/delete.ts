"use server";

import { getServerSession } from "next-auth";

import { db } from "@/lib/kysely";
import { authOptions } from "@/utils/authoptions";
import { AuthorizationError, UnwrapPromise, withErrorHandling } from "@/utils/error";

export async function deleteFile({ uuid }: { uuid: string }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.id) {
    throw new AuthorizationError();
  }

  // verify user created the file or is admin
  if (!session.user.isAdmin) {
    const file = await db
      .selectFrom("startups_files")
      .select("created_by")
      .where("uuid", "=", uuid)
      .executeTakeFirst();
    if (!file || file.created_by !== session.user.uuid) {
      throw new AuthorizationError();
    }
  }

  await db
    .updateTable("startups_files")
    .set({ deleted_by: session.user.uuid, deleted_at: new Date() })
    .where("uuid", "=", uuid)
    .executeTakeFirstOrThrow();
  return true;
}

export const safeDeleteFile = withErrorHandling<
  UnwrapPromise<ReturnType<typeof deleteFile>>,
  Parameters<typeof deleteFile>
>(deleteFile);
