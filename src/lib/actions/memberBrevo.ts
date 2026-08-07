"use server";

import { getServerSession } from "next-auth";

import { db } from "@/lib/kysely";
import { brevoEmailInfoDataSchema } from "@/models/brevoInfo";
import { brevoEmailEventDataSchema } from "@/models/brevoEvent";
import {
  getAllTransacBlockedContacts,
  getContactInfo,
  getSendEventForUser,
} from "@/lib/email/sendInBlue";
import { authOptions } from "@/lib/authoptions";
import {
  AdminAuthorizationError,
  AuthorizationError,
  withErrorHandling,
} from "@/lib/error";

async function getBrevoEmailInfoAction(username: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new AuthorizationError();
  }

  const dbUser = await db
    .selectFrom("users")
    .select(["primary_email", "secondary_email"])
    .where("username", "=", username)
    .executeTakeFirst();

  let emailServiceInfo: Record<string, unknown> = {};
  if (dbUser?.primary_email) {
    emailServiceInfo["primaryEmail"] = await getContactInfo({
      email: dbUser.primary_email,
    });
  }
  if (dbUser?.secondary_email) {
    emailServiceInfo["secondaryEmail"] = await getContactInfo({
      email: dbUser.secondary_email,
    });
  }

  const blockedContacts = await getAllTransacBlockedContacts();
  if (dbUser?.primary_email) {
    emailServiceInfo["primaryEmailTransac"] = blockedContacts.find(
      (contact) => dbUser.primary_email === contact.email,
    );
  }
  if (dbUser?.secondary_email) {
    emailServiceInfo["secondaryEmailTransac"] = blockedContacts.find(
      (contact) => dbUser.secondary_email === contact.email,
    );
  }

  return brevoEmailInfoDataSchema.parse(emailServiceInfo);
}

async function getBrevoEventsAction(username: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
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

  const resp: {
    primary_email: Record<string, unknown>;
    secondary_email: Record<string, unknown>;
  } = {
    primary_email: {},
    secondary_email: {},
  };

  if (dbUser?.primary_email) {
    resp.primary_email = {
      email: dbUser.primary_email,
      events: [],
    };
    try {
      resp.primary_email["events"] = await getSendEventForUser(
        dbUser.primary_email,
      );
    } catch (e) {
      console.error("Failed to fetch brevo events for primary email:", e);
    }
  }
  if (dbUser?.secondary_email) {
    resp.secondary_email = {
      email: dbUser.secondary_email,
      events: [],
    };
    try {
      resp.secondary_email["events"] = await getSendEventForUser(
        dbUser.secondary_email,
      );
    } catch (e) {
      console.error("Failed to fetch brevo events for secondary email:", e);
    }
  }

  return brevoEmailEventDataSchema.safeParse(resp);
}

export const getBrevoEmailInfo = withErrorHandling(getBrevoEmailInfoAction);
export const getBrevoEvents = withErrorHandling(getBrevoEventsAction);
