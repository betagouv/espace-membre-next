import { ExpressionBuilder } from "kysely";

import { db, jsonArrayFrom } from "@/lib/kysely";
import { DB } from "@/@types/db";

// rows removed from Dimail are kept for history only
export const isLive = (eb: ExpressionBuilder<DB, "dinum_emails">) =>
  eb.or([eb("status", "is", null), eb("status", "!=", "deleted")]);

/**
 * return first row matching given email in `dinum_emails` database table.
 */
export const getDimailEmail = (email: string) =>
  db
    .selectFrom("dinum_emails")
    .selectAll()
    .where("email", "=", email)
    .where(isLive)
    .executeTakeFirst();

export const getDimailEmailsByUser = (
  userId: string,
  type: "mailbox" | "alias" = "mailbox",
) =>
  db
    .selectFrom("dinum_emails")
    .selectAll()
    .where("user_id", "=", userId)
    .where("dinum_emails.type", "=", type)
    .where(isLive)
    .execute();
