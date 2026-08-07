"use server";

import { getServerSession } from "next-auth";

import { getEventListByUsername } from "@/lib/events";
import { authOptions } from "@/lib/authoptions";
import { AuthorizationError, withErrorHandling } from "@/lib/error";

async function getMemberEventsByUsernameAction(username: string) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.id) {
    throw new AuthorizationError();
  }
  if (!session.user.isAdmin) {
    return [];
  }

  return await getEventListByUsername(username);
}

export const getMemberEventsByUsername = withErrorHandling(
  getMemberEventsByUsernameAction,
);
