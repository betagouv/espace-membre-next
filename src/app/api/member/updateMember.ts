import { UpdateObjectExpression } from "kysely/dist/cjs/parser/update-set-parser";

import { DB } from "@/@types/db";
import { db } from "@/lib/kysely";
import {
    createMission,
    deleteMission,
    updateMission,
} from "@/lib/kysely/queries/missions";
import { getUserInfos, updateUser } from "@/lib/kysely/queries/users";
import {
    memberInfoUpdateSchemaType,
    memberValidateInfoSchemaType,
} from "@/models/actions/member";

export async function updateMember(
    {
        missions,
        ...memberData
    }: memberInfoUpdateSchemaType | memberValidateInfoSchemaType,
    memberUuid: string
) {
    const previousInfo = await getUserInfos({ uuid: memberUuid });
    if (!previousInfo) {
        throw new Error("User does not exists");
    }

    try {
        await db.transaction().execute(async (trx) => {
            await trx
                .updateTable("users")
                .where("uuid", "=", memberUuid)
                .set(memberData)
                .execute();
            const actualMissions = missions
                ? missions.filter((m) => m.uuid).map((m) => m.uuid)
                : [];
            const missionsToDelete = previousInfo.missions.filter(
                (m) => !actualMissions.includes(m.uuid)
            );
            for (let mission of missionsToDelete) {
                await deleteMission(mission.uuid, trx);
            }
            for (const mission of missions) {
                // Now, use the same transaction to link to an organization
                if (mission.uuid) {
                    const { uuid, ...missionOtherData } = mission;
                    updateMission(
                        uuid,
                        {
                            ...missionOtherData,
                            user_id: memberUuid,
                        },
                        trx
                    );
                } else {
                    await createMission(
                        {
                            ...mission,
                            user_id: memberUuid,
                        },
                        trx
                    );
                }
            }
        });
    } catch (error) {
        console.error("Transaction failed:", error);
        throw error;
    }
    // addEvent({
    //     action_code: EventCode.MEMBER_BASE_INFO_UPDATED,
    //     created_by_username: session.user.id as string,
    //     action_on_username: username,
    //     action_metadata: {
    //         value: rawdata,
    //         old_value: previousInfo
    //     }
    // });
    return true;
}
