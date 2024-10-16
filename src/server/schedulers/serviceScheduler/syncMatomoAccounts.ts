import _ from "lodash";

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
    const allWebsites = await matomoClient.getAllSites();
    const matomoUsers = await Promise.all(
        (
            await matomoClient.getAllUsers()
        ).map(async (matomoUser) => {
            const userMetadata = await matomoClient.fetchUserAccess(
                matomoUser.serviceUserId
            );
            return matomoUserToModel(
                matomoUser.user,
                userMetadata,
                allWebsites
            );
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
            return oc
                .column("service_user_id")
                .column("account_type")
                .doUpdateSet({
                    metadata: (eb) => eb.ref("excluded.metadata"),
                    user_id: (eb) => eb.ref("excluded.user_id"),
                });
        })
        .execute();
    console.log(
        `Inserted or updated ${result[0].numInsertedOrUpdatedRows} matomo users`
    );

    const matomoUserIdsInDb = (
        await db
            .selectFrom("service_accounts")
            .select("service_user_id")
            .execute()
    ).map((u) => u.service_user_id);
    const matomoUserIds = matomoUsers.map(
        (matomoUser) => matomoUser.service_user_id
    );
    const accountsToRemoveFromDb = _.difference(
        matomoUserIdsInDb,
        matomoUserIds
    );
    if (accountsToRemoveFromDb.length > 0) {
        // Ensure the array is not empty
        await db
            .deleteFrom("service_accounts")
            .where("service_user_id", "in", accountsToRemoveFromDb)
            .execute();
    }
}
