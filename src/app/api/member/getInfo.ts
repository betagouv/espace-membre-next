import { getEventListByUsername } from "@/lib/events";
import { db } from "@/lib/kysely";
import { getUserBasicInfo, getUserStartups } from "@/lib/kysely/queries/users";
import { getAvatarUrl } from "@/lib/s3";
import { memberChangeToModel, memberBaseInfoToModel } from "@/models/mapper";

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

  const matrixAccount = await db
    .selectFrom("matrix_accounts")
    .select("matrix_id")
    .where("user_id", "=", dbUser.uuid)
    .executeTakeFirst();

  return {
    id,
    changes,
    avatar,
    baseInfo,
    startups,
    matrixId: matrixAccount?.matrix_id,
  };
};
