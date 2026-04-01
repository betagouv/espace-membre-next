import { matomoClient } from "../config/matomo.config";
import { sentryClient } from "../config/sentry.config";
import { addEvent } from "@/lib/events";
import { getAllExpiredUsers } from "@/lib/kysely/queries/users";
import { EventCode, SYSTEM_NAME } from "@/models/actionEvent";
import { memberBaseInfoToModel } from "@/models/mapper";
import { AccountService } from "@/models/services";

export async function deleteMatomoAccount() {
  await deleteServiceAccounts(matomoClient);
}

export async function deleteSentryAccount() {
  await deleteServiceAccounts(sentryClient);
}

export async function deleteServiceAccounts(
  service: AccountService, // Accept any service that implements the AccountService interface
) {
  const allServiceUsers = await service.getAllUsers();
  // const allServiceUserEmails = allServiceUsers.map((user) => user.email);
  const today = new Date();
  const todayLess30days = new Date();
  todayLess30days.setDate(today.getDate() - 30);
  // todo: fix
  const expiredUsers = (await getAllExpiredUsers(todayLess30days)).map((user) =>
    memberBaseInfoToModel(user),
  );

  const expiredUsersWrappers = expiredUsers
    .map((expiredUsers) => ({
      dbUser: expiredUsers,
      serviceUser:
        allServiceUsers.find(
          (serviceUser) =>
            serviceUser.user.email === expiredUsers.primary_email,
        ) || null,
    }))
    .filter((expiredUser) => expiredUser.serviceUser);

  for (const user of expiredUsersWrappers) {
    try {
      if (user.serviceUser?.serviceUserId) {
        console.log(
          `Suppression du compte ${service.name} pour ${user.dbUser.username}`,
        );
        await service.deleteUserByServiceId(user.serviceUser.serviceUserId);
        console.log(
          `Compte ${service.name} supprimé pour ${user.dbUser.username}`,
        );
        await addEvent({
          created_by_username: SYSTEM_NAME,
          action_code: EventCode.MEMBER_SERVICE_ACCOUNT_DELETED,
          action_metadata: {
            email: user.serviceUser.user.email,
            service: service.name,
          },
        });
      }
    } catch (err) {
      console.error(
        `Erreur lors de la suppression du compte pour ${user.dbUser.username} : ${err}`,
      );
    }
  }
}
