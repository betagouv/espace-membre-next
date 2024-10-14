import { metadata } from "@/app/(private)/(dashboard)/community/page";
import { db } from "@/lib/kysely";
import { getAllUsersInfo } from "@/lib/kysely/queries/users";
import { Matomo } from "@/lib/matomo";
import { memberBaseInfoToModel } from "@/models/mapper";
import { matomoUserToModel } from "@/models/mapper/matomoMapper";
import { FakeMatomo } from "@/server/config/matomo.config";

export async function syncMatomoAccounts(matomoClient: Matomo | FakeMatomo) {
    const dbUsers = (await getAllUsersInfo()).map((user) =>
        memberBaseInfoToModel(user)
    );
    const matomoUsers = await Promise.all(
        (
            await matomoClient.getAllUsers()
        ).map(async (matomoUser) => {
            const userMetadata = await matomoClient.fetchUserAccess(
                matomoUser.serviceUserId
            );
            return matomoUserToModel(matomoUser.user, userMetadata);
        })
    );
    const usersToInsert = matomoUsers.map((matomoUser) => {
        const user = dbUsers.find(
            (user) => user.primary_email === matomoUser.email
        );
        return {
            account_type: matomoUser.account_type,
            service_user_id: matomoUser.service_user_id,
            metadata: matomoUser.metadata,
            // we keep the accounts we cannot linked to anyone
            user_id: user ? user.uuid : null,
        };
    });
    const result = await db
        .insertInto("service_accounts")
        .values(usersToInsert)
        .onConflict((oc) => {
            return oc.doNothing();
        })
        .execute();
    console.log(`Insert ${usersToInsert.length} matomo users`);
}
