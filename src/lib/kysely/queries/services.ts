import { db } from "@/lib/kysely";
import { SERVICES } from "@/models/services";

export async function getServiceAccount(userId: string, service: SERVICES) {
    return db
        .selectFrom("service_accounts")
        .selectAll()
        .where("user_id", "=", userId)
        .where("account_type", "=", service)
        .executeTakeFirst();
}
