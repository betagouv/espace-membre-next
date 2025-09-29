import { db, jsonArrayFrom } from "@/lib/kysely";

/**
 * return first row matching given email in `dinum_emails` database table.
 */
export const getDimailEmail = (email: string) =>
  db
    .selectFrom("dinum_emails")
    .selectAll()
    .where("email", "=", email)
    .executeTakeFirst();
