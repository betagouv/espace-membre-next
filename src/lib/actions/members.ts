"use server";

import { getServerSession } from "next-auth";

import { searchUsers } from "@/lib/kysely/queries/search";
import { authOptions } from "@/lib/authoptions";
import { AuthorizationError, withErrorHandling } from "@/lib/error";

async function searchMembersAction(searchParams: URLSearchParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new AuthorizationError();
  }
  const users = await searchUsers(searchParams);
  return { users };
}

export const searchMembers = withErrorHandling(searchMembersAction);
