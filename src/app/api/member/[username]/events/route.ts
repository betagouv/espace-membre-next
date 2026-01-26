import { getServerSession } from "next-auth";

import { getEventListByUsername } from "@/lib/events";
import { authOptions } from "@/utils/authoptions";
import { AuthorizationError, withHttpErrorHandling } from "@/utils/error";

async function getEventListByUsernameHanlder(
  req: Request,
  {
    params,
  }: {
    params: Promise<{
      username: string;
    }>;
  },
) {
  const { username } = await params;
  const session = await getServerSession(authOptions);

  if (!session || !session.user.id) {
    throw new AuthorizationError();
  }
  if (!session.user.isAdmin) {
    console.error(
      `get user events error: User should be admin or should owned data`,
    );
    return Response.json([]);
  }

  let events = await getEventListByUsername(username);

  return Response.json(events);
}

export const GET = withHttpErrorHandling(getEventListByUsernameHanlder);
