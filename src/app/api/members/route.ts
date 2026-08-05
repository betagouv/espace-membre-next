import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";

import { searchUsers } from "@/lib/kysely/queries/search";
import { authOptions } from "@/server/authoptions";
import { AuthorizationError, withHttpErrorHandling } from "@/lib/error";

async function SearchUserHandler(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.id) {
    throw new AuthorizationError();
  }
  const { searchParams } = new URL(req.url);
  const users = await searchUsers(searchParams);
  const data = { users };
  return Response.json(data);
}

export const GET = withHttpErrorHandling(SearchUserHandler);
