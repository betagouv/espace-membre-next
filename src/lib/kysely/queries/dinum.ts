import { db, jsonArrayFrom } from "@/lib/kysely";

export const getDinumEmail = (email: string) =>
    db
        .selectFrom("dinum_emails")
        .selectAll()
        .where("email", "=", email)
        .executeTakeFirst();

export const getAllDinumEmails = () =>
    db
        .selectFrom("dinum_emails")
        .select("email")
        .execute()
        .then((rows) => rows.map((r) => r.email));
