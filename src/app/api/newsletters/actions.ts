"use server";

import { getServerSession } from "next-auth";

import { db } from "@/lib/kysely";
import {
  newsletterInfoUpdateSchema,
  newsletterInfoUpdateSchemaType,
} from "@/models/actions/newsletter";
import { authOptions } from "@/utils/authoptions";
import {
  AuthorizationError,
  ValidationError,
  withErrorHandling,
} from "@/utils/error";

export const updateNewsletter = async (
  data: newsletterInfoUpdateSchemaType,
  newsletterId: string,
) => {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.id) {
    throw new AuthorizationError();
  }
  try {
    newsletterInfoUpdateSchema.parse(data);
  } catch (error) {
    console.error("Database update failed:", error);
    throw new ValidationError(`Erreur de validation des données : ${error}`);
  }

  await db
    .updateTable("newsletters")
    .where("id", "=", newsletterId)
    .set({
      ...data,
    })
    .execute();
  return true;
};

export const safeUpdateNewsletter = withErrorHandling(updateNewsletter);
