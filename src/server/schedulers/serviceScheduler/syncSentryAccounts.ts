import _ from "lodash";
import pAll from "p-all";

import { db } from "@/lib/kysely";
import { getAllUsersInfo } from "@/lib/kysely/queries/users";
import { SentryService } from "@/lib/sentry";
import { memberBaseInfoToModel } from "@/models/mapper";
import { sentryUserToModel } from "@/models/mapper/sentryMapper";
import { FakeSentryService } from "@/server/config/sentry.config";

export async function syncSentryAccounts(
    sentryClient: SentryService | FakeSentryService
) {
    const dbUsers = (await getAllUsersInfo()).map((user) =>
        memberBaseInfoToModel(user)
    );
    const allTeams = await sentryClient.getAllTeams();
    const sentryUsers = await sentryClient.getAllUsers();

    const sentryUsersWithAccessPromises = sentryUsers.map(
        (sentryUser) => async () => {
            const userMetadata = await sentryClient.fetchUserAccess(
                sentryUser.serviceUserId
            );
            return sentryUserToModel(sentryUser.user, userMetadata, allTeams);
        }
    );

    const sentryUsersWithAccess = await pAll(sentryUsersWithAccessPromises, {
        concurrency: 5, // Limit concurrency to 5
    });
    const usersToInsert = sentryUsersWithAccess.map((sentryUser) => {
        const user = dbUsers.find(
            (user) => user.primary_email === sentryUser.email
        );
        return {
            account_type: sentryUser.account_type,
            service_user_id: sentryUser.service_user_id,
            metadata: sentryUser.metadata,
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
        .executeTakeFirst();
    console.log(
        `Inserted or updated ${result.numInsertedOrUpdatedRows} sentry users`
    );

    const sentryUserIdsInDb = (
        await db
            .selectFrom("service_accounts")
            .select("service_user_id")
            .execute()
    ).map((u) => u.service_user_id);
    const sentryUserIds = sentryUsers.map(
        (sentryUser) => sentryUser.serviceUserId
    );
    const accountsToRemoveFromDb = _.difference(
        sentryUserIdsInDb,
        sentryUserIds
    );
    if (accountsToRemoveFromDb.length > 0) {
        // Ensure the array is not empty
        const deletedRes = await db
            .deleteFrom("service_accounts")
            .where("service_user_id", "in", accountsToRemoveFromDb)
            .executeTakeFirst();
        console.log(`Deleted ${deletedRes.numDeletedRows} sentry users`);
    }
}
