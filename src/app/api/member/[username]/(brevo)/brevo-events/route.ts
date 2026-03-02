import { getServerSession } from "next-auth";

import { db } from "@/lib/kysely";
import { brevoEmailEventDataSchema } from "@/models/brevoEvent";
import { getSendEventForUser } from "@/server/infra/email/sendInBlue";
import { authOptions } from "@/utils/authoptions";
import {
  AdminAuthorizationError,
  AuthorizationError,
  withHttpErrorHandling,
} from "@/utils/error";

async function getBrevoEventsHandler(
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
    throw new AdminAuthorizationError();
  }

  const dbUser = await db
    .selectFrom("users")
    .select(["primary_email", "secondary_email"])
    .where("username", "=", username)
    .executeTakeFirst();
  const resp = {
    primary_email: {},
    secondary_email: {},
  };
  if (dbUser?.primary_email) {
    resp.primary_email = {
      email: dbUser.primary_email,
      events: [],
      error: null,
    };
    try {
      resp.primary_email["events"] = await getSendEventForUser(
        dbUser.primary_email,
      );
    } catch (e) {
      resp.primary_email["error"] = e;
    }
  }
  if (dbUser?.secondary_email) {
    resp.secondary_email = {
      email: dbUser.secondary_email,
      events: [],
      error: null,
    };
    try {
      resp.secondary_email["events"] = await getSendEventForUser(
        dbUser.secondary_email,
      );
    } catch (e) {
      resp.secondary_email["error"] = e;
    }
  }
  return Response.json(brevoEmailEventDataSchema.parse(resp));
}

export const GET = withHttpErrorHandling(getBrevoEventsHandler);
