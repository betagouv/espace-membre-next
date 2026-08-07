import { EmailInfos, EMAIL_PLAN_TYPE } from "@/models/member";
import { getDimailEmail } from "@/lib/kysely/queries/dimail";
import config from "@/lib/config";
import { db } from "@/lib/kysely";
import { getUserBasicInfo } from "@/lib/kysely/queries/users";
import { memberPublicInfoToModel } from "@/models/mapper";
import { BusinessError, NoDataError } from "@/lib/error";

export async function emailInfos(id: string): Promise<EmailInfos | null> {
  const email = `${id}@${config.domain}`;
  const dimailEmail = await getDimailEmail(email);
  if (dimailEmail) {
    return {
      email,
      emailPlan: EMAIL_PLAN_TYPE.EMAIL_PLAN_OPI,
      isBlocked: false,
    };
  }
  return null;
}

export async function getMemberIfValidOrThrowError(userId: string) {
  const memberDbData = await getUserBasicInfo({ uuid: userId });
  if (!memberDbData) {
    throw new NoDataError(`Pas de membre trouvé pour l'id : ${userId}`);
  }
  const newMember = memberPublicInfoToModel(memberDbData);
  const userMissions = await db
    .selectFrom("missions")
    .selectAll()
    .where("user_id", "=", userId)
    .execute();
  if (!userMissions.length) {
    throw new BusinessError(
      "NoActiveMissionForUser",
      `User ${userId} does not have any missions`,
    );
  }
  return newMember;
}
