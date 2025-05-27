import _ from "lodash";
import pAll from "p-all";

import { db } from "@/lib/kysely";
import { getAllUsersInfo } from "@/lib/kysely/queries/users";
import { Matomo } from "@/lib/matomo";
import { memberBaseInfoToModel } from "@/models/mapper";
import { matomoUserToModel } from "@/models/mapper/matomoMapper";
import { ACCOUNT_SERVICE_STATUS, SERVICES } from "@/models/services";
import { FakeMatomo } from "@/server/config/matomo.config";

export async function syncMatomoAccounts(matomoClient: Matomo | FakeMatomo) {
  const dbUsers = (await getAllUsersInfo()).map((user) =>
    memberBaseInfoToModel(user),
  );

  const allWebsites = await matomoClient.getAllSites();
  const matomoUsers = await matomoClient.getAllUsers();

  const matomoUsersWithAccessPromises = matomoUsers.map(
    (matomoUser) => async () => {
      const userMetadata = await matomoClient.fetchUserAccess(
        matomoUser.serviceUserId,
      );
      return matomoUserToModel(matomoUser.user, userMetadata, allWebsites);
    },
  );

  const matomoUsersWithAccess = await pAll(matomoUsersWithAccessPromises, {
    concurrency: 5,
  });
  const usersToInsert = matomoUsersWithAccess.map((matomoUser) => {
    const user = dbUsers.find(
      (user) => user.primary_email === matomoUser.email,
    );
    return {
      account_type: matomoUser.account_type,
      service_user_id: matomoUser.service_user_id,
      metadata: matomoUser.metadata,
      email: matomoUser.email,
      status: ACCOUNT_SERVICE_STATUS.ACCOUNT_FOUND,
      // we keep the accounts we cannot linked to anyone
      user_id: user ? user.uuid : null,
    };
  });
  if (usersToInsert.length) {
    const result = await db
      .insertInto("service_accounts")
      .values(usersToInsert)
      .onConflict((oc) => {
        return oc
          .columns(["email", "account_type", "service_user_id"]) // Define the conflict targe
          .doUpdateSet({
            metadata: (eb) => eb.ref("excluded.metadata"),
            service_user_id: (eb) => eb.ref("excluded.service_user_id"),
            user_id: (eb) => eb.ref("excluded.user_id"),
            status: ACCOUNT_SERVICE_STATUS.ACCOUNT_FOUND,
          });
      })
      .executeTakeFirstOrThrow();
    console.log(
      `Inserted or updated ${result.numInsertedOrUpdatedRows} matomo users`,
    );
  }

  const matomoUserIdsInDb = (
    await db
      .selectFrom("service_accounts")
      .select("service_user_id")
      .where("account_type", "=", SERVICES.MATOMO)
      .where("status", "=", ACCOUNT_SERVICE_STATUS.ACCOUNT_FOUND)
      .execute()
  ).map((u) => u.service_user_id);
  const matomoUserIds = matomoUsers.map(
    (matomoUser) => matomoUser.serviceUserId,
  );
  const accountsToRemoveFromDb = _.difference(matomoUserIdsInDb, matomoUserIds);
  if (accountsToRemoveFromDb.length > 0) {
    // Ensure the array is not empty
    const deletedResult = await db
      .deleteFrom("service_accounts")
      .where("service_user_id", "in", accountsToRemoveFromDb)
      .executeTakeFirstOrThrow();
    console.log(
      `Deleted ${deletedResult.numDeletedRows} matomo service_accounts`,
    );
  }
}
