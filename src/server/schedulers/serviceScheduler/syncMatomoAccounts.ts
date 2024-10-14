import { db } from "@/lib/kysely";
import { matomoUserToModel } from "@/models/mapper/matomoMapper";
import { matomoClient } from "@/server/config/matomo.config";

export async function syncMatomoAccounts() {
    const users = await matomoClient.getAllUsers();
    const usersAsMatomoModelUsers = users.map((user) =>
        matomoUserToModel(user)
    );
    const result = await db
        .insertInto("service_accounts")
        .values(usersAsMatomoModelUsers)
        .onConflict("id") // or 'username' or 'email', depending on your conflict strategy
        .doUpdateSet({
            username: db.raw("excluded.username"), // Update fields as needed
            email: db.raw("excluded.email"),
        })
        .execute();
}
