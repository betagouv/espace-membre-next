import { getEventListByUsername } from "@/lib/events";
import { db } from "@/lib/kysely";
import { getUserBasicInfo, getUserStartups } from "@/lib/kysely/queries/users";
import { getAvatarUrl } from "@/lib/s3";
import { memberChangeToModel, memberBaseInfoToModel } from "@/models/mapper";
import { matomoServiceInfoToModel } from "@/models/mapper/matomoMapper";
import { sentryServiceInfoToModel } from "@/models/mapper/sentryMapper";
import { SERVICES } from "@/models/services";

export const getUserInformations = async (id) => {
  // informations needed
  const dbUser = await getUserBasicInfo({ username: id });
  if (!dbUser) {
    return null;
  }
  const changes = (await getEventListByUsername(id)).map(memberChangeToModel);

  const avatar = await getAvatarUrl(dbUser.username);

  const baseInfo = memberBaseInfoToModel(dbUser);

  const startups = await getUserStartups(dbUser.uuid);

  const matomoInfo = await db
    .selectFrom("service_accounts")
    .selectAll()
    .where("user_id", "=", dbUser.uuid)
    .where("account_type", "=", SERVICES.MATOMO)
    .executeTakeFirst()
    .then((account) => {
      if (account) {
        return matomoServiceInfoToModel(account);
      }
    });

  const sentryInfo = await db
    .selectFrom("service_accounts")
    .selectAll()
    .where("user_id", "=", dbUser.uuid)
    .where("account_type", "=", SERVICES.SENTRY)
    .executeTakeFirst()
    .then((account) => {
      if (account) {
        return sentryServiceInfoToModel(account);
      }
    });

  return {
    id,
    changes,
    avatar,
    baseInfo,
    startups,
    matomoInfo,
    sentryInfo,
  };
};
