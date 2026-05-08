import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { canEditStartup } from "@/lib/canEditStartup";
import { db } from "@/lib/kysely";
import { authOptions } from "@/utils/authoptions";
import {
  AuthorizationError,
  BusinessError,
  withHttpErrorHandling,
} from "@/utils/error";

async function getFileHandler(
  req: NextRequest,
  { params: { id } }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.id) {
    throw new AuthorizationError();
  }
  if (!id) {
    throw new BusinessError(
      "missingFileId",
      `Identifiant du fichier non fourni`,
    );
  }
  const file = await db
    .selectFrom("startups_files")
    .select(["filename", "base64", "startup_id"])
    .where("uuid", "=", id)
    .where("deleted_at", "is", null)
    .executeTakeFirstOrThrow();

  // Defense in depth: only allow downloading files attached to a startup the
  // session user can edit (admin, member of the incubator team, or active
  // startup agent). Startup files may contain sensitive documents
  // (conventions, contracts, personal data).
  if (!(await canEditStartup(session, file.startup_id))) {
    throw new AuthorizationError();
  }

  if (file.base64) {
    const decoded = file.base64.toString().split(",").slice(1).join(""); // remove base64 header
    const resp = Buffer.from(decoded, "base64");
    return new Response(resp);
  }
  return new Response("404", { status: 404 });
}

export const GET = withHttpErrorHandling(getFileHandler);
