import { getServerSession } from "next-auth";

import { addEvent } from "@/lib/events";
import { db, jsonArrayFrom } from "@/lib/kysely";
import {
    createMission,
    deleteMission,
    updateMission,
} from "@/lib/kysely/queries/missions";
import { getUserInfos, updateUser } from "@/lib/kysely/queries/users";
import { baseInfoUpdateSchema } from "@/models/actions/member";
import { authOptions } from "@/utils/authoptions";

export async function PUT(
    req: Request,
    { params: { username } }: { params: { username: string } }
) {
    console.log("Info Update");
    const session = await getServerSession(authOptions);
    if (!session || session.user.id !== username) {
        throw new Error(`You don't have the right to access this function`);
    }
    const rawdata = await req.json();
    const { missions, ...userData } = baseInfoUpdateSchema.parse(rawdata);
    const previousInfo = await getUserInfos({ username });
    if (!previousInfo) {
        throw new Error("User does not exists");
    }

    try {
        await db.transaction().execute(async (trx) => {
            updateUser(session?.user.uuid, userData, trx);
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
                            user_id: session?.user.uuid,
                        },
                        trx
                    );
                } else {
                    await createMission(
                        {
                            ...mission,
                            user_id: session?.user.uuid,
                        },
                        trx
                    );
                }
            }
        });
    } catch (error) {
        console.error("Transaction failed:", error);
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

    const dbUser = await getUserInfos({
        username,
        options: { withDetails: true },
    });

    return Response.json({
        message: `Success`,
        data: dbUser,
    });

    // return Response.json({
    //     message: `Success`,
    //     pr_url: prInfo.html_url,
    // });
}
