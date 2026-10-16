import { VerificationToken } from "next-auth/adapters";

import { normalizeLoginEmail } from "@/lib/auth/findUsersByLoginEmail";
import { db } from "@/lib/kysely";

import { isLegacyEmailLoginEnabled } from "./config";

const createVerificationToken = async ({
  identifier,
  expires,
  token,
}: VerificationToken): Promise<VerificationToken | null | undefined> => {
  const insertedRow = await db
    .insertInto("verification_tokens")
    .values({
      identifier: identifier,
      token: token,
      expires: expires,
    })
    .returningAll()
    .executeTakeFirst(); // This will return all columns of the inserted row
  if (!insertedRow) {
    throw new Error("Row not created");
  }
  const createdToken: VerificationToken = {
    identifier: insertedRow.identifier,
    token: insertedRow.token,
    expires: insertedRow.expires,
  };
  return createdToken;
};

// single use : the token is deleted once read
const useVerificationToken = async ({
  identifier,
  token,
}: {
  identifier: string;
  token: string;
}) => {
  const rows = await db
    .selectFrom("verification_tokens")
    .selectAll()
    .where("identifier", "=", identifier)
    .where("token", "=", token)
    .where("expires", ">", new Date())
    .execute()
    .then((rows) => rows)
    .catch((err) => {
      console.error(err);
      throw new Error("Error fetching verification token");
    });

  if (rows.length > 0) {
    await db
      .deleteFrom("verification_tokens")
      .where("identifier", "=", identifier)
      .where("token", "=", token)
      .execute()
      .catch((err) => {
        console.error(err);
        throw new Error("Error deleting verification token");
      });

    return {
      expires: rows[0].expires,
      identifier: rows[0].identifier,
      token: rows[0].token,
    };
  } else {
    throw new Error(`No valid token found: ${token}`);
  }
};

export const legacyEmailLoginAdapterMethods = {
  createVerificationToken,
  useVerificationToken,
};

// the personal email (secondary_email) still logs in with the magic link, it
// is how members without a mailbox reach the espace-membre. Only used as a
// fallback when no primary or Dimail address matches, so ProConnect lookups
// (which always match one first) are never affected.
export const findUsersBySecondaryEmail = async (
  email: string | null | undefined,
) => {
  const normalized = normalizeLoginEmail(email);
  if (!normalized || !isLegacyEmailLoginEnabled()) {
    return [];
  }
  return db
    .selectFrom("users")
    .selectAll()
    .where(({ eb, fn }) =>
      eb(fn("lower", ["secondary_email"]), "=", normalized),
    )
    .limit(2)
    .execute();
};
