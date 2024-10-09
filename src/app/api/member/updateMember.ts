"use server";

import { z } from "zod";

import { addEvent } from "@/lib/events";
import { db } from "@/lib/kysely";
import {
    createMission,
    deleteMission,
    updateMission,
} from "@/lib/kysely/queries/missions";
import { getUserInfos } from "@/lib/kysely/queries/users";
import { EventCode } from "@/models/actionEvent/actionEvent";
import {
    memberInfoUpdateSchema,
    memberValidateInfoSchemaType,
} from "@/models/actions/member";
import { userInfosToModel } from "@/models/mapper";
import { EmailStatusCode } from "@/models/member";

export async function updateMember(
    data:
        | z.infer<typeof memberInfoUpdateSchema.shape.member>
        | memberValidateInfoSchemaType,
    memberUuid: string,
    extraParams:
        | {
              primary_email: string;
              secondary_email: null;
              primary_email_status: EmailStatusCode;
          }
        | {
              primary_email: null;
              secondary_email: string;
              primary_email_status: EmailStatusCode;
          }
        | {} = {}, // quick hack to update primary_email,secondary_email and primary_email_status on verify
    created_by_username: string
) {
    // todo: auth
    const { missions, ...memberData } = data;
    const previousInfo = await getUserInfos({ uuid: memberUuid });
    if (!previousInfo) {
        throw new Error("User does not exists");
    }
    try {
        await db.transaction().execute(async (trx) => {
            await trx
                .updateTable("users")
                .where("uuid", "=", memberUuid)
                .set({
                    fullname: memberData.fullname,
                    role: memberData.role,
                    link: memberData.link,
                    avatar: memberData.avatar,
                    github: memberData.github,
                    competences: JSON.stringify(memberData.competences),
                    // teams: memberData.teams,
                    secondary_email:
                        "secondary_email" in memberData
                            ? memberData.secondary_email
                            : undefined,
                    domaine: memberData.domaine,
                    bio: memberData.bio,
                    gender: memberData.gender,
                    average_nb_of_days: memberData.average_nb_of_days,
                    tjm: memberData.tjm,
                    legal_status: memberData.legal_status,
                    workplace_insee_code: memberData.workplace_insee_code,
                    osm_city: memberData.osm_city,
                    member_type: memberData.memberType,
                    ...extraParams,
                })
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
    await addEvent({
        action_code: EventCode.MEMBER_BASE_INFO_UPDATED,
        created_by_username: created_by_username,
        action_on_username: previousInfo.username,
        action_metadata: {
            value: data,
            old_value: userInfosToModel(previousInfo),
        },
    });
    return true;
}
