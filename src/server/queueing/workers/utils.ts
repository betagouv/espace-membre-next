import { db } from "@/lib/kysely";
import { getUserBasicInfo } from "@/lib/kysely/queries/users";
import { memberPublicInfoToModel } from "@/models/mapper";
import { BusinessError, NoDataError } from "@/utils/error";

export async function checkUserIsValidOrThrowError(userId: string) {
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
            `User ${userId} does not have any missions`
        );
    }
}
