import { getServerSession } from "next-auth";

import { getEventListByUsername } from "@/lib/events";
import { authOptions } from "@/lib/authoptions";
import { AuthorizationError, withHttpErrorHandling } from "@/lib/error";

async function getEventListByUsernameHanlder(
  req: Request,
  {
    params: { username },
  }: {
    params: {
      username: string;
    };
  },
) {
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
