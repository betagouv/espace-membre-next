"use server";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";

import { canEditStartup } from "@/lib/canEditStartup";
import { db } from "@/lib/kysely";
import { DocSchemaType } from "@/models/startupFiles";
import { authOptions } from "@/utils/authoptions";
import { AuthorizationError } from "@/utils/error";

const commonFileFields = [
  "startups_files.filename",
  "startups_files.title",
  "startups_files.uuid",
  "startups_files.size",
  "startups_files.comments",
  "startups_files.created_at",
  "startups_files.type",
  "startups_files.data",
] as const;

type PostParams = {
  content: string;
  uuid: string;
  filename: string;
  size: number;
  data?: any;
};

export async function uploadStartupFile(
  {
    title,
    type,
    uuid,
    content,
    comments,
    filename,
    size,
    data,
  }: DocSchemaType & PostParams, // formData: {
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.id) {
    throw new AuthorizationError();
  }
  // Defense in depth: only allow uploading files to a startup the user can
  // edit (admin, member of the incubator team, or active startup agent).
  if (!(await canEditStartup(session, uuid))) {
    throw new AuthorizationError();
  }
  const base64 = Buffer.from(content);

  const inserted = await db
    .insertInto("startups_files")
    .values({
      base64,
      type,
      data,
      comments,
      filename,
      size,
      title,
      startup_id: uuid,
      created_by: session.user.uuid,
    })
    .returning(commonFileFields)
    .executeTakeFirstOrThrow();
  revalidatePath("/startups");
  return inserted;
}
