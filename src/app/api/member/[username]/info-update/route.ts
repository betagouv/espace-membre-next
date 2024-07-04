import { getServerSession } from "next-auth";

import { updateMember } from "../../updateMember";
import { addEvent } from "@/lib/events";
import { db, jsonArrayFrom } from "@/lib/kysely";
import {
    createMission,
    deleteMission,
    updateMission,
} from "@/lib/kysely/queries/missions";
import { getUserInfos, updateUser } from "@/lib/kysely/queries/users";
import { memberInfoUpdateSchema } from "@/models/actions/member";
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
    const memberData = memberInfoUpdateSchema.parse(rawdata);
    const previousInfo = await getUserInfos({ username });
    if (!previousInfo) {
        throw new Error("User does not exists");
    }

    await updateMember(memberData, session.user.uuid);

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
