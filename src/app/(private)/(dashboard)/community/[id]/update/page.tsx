import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { BreadCrumbFiller } from "@/app/BreadCrumbProvider";
import { MemberUpdate } from "@/components/MemberUpdate/MemberUpdate";
import { getAllStartups } from "@/lib/kysely/queries";
import { getUserBasicInfo } from "@/lib/kysely/queries/users";
import { memberBaseInfoToModel } from "@/models/mapper";
import { isSessionUserIncubatorTeamAdminForUser } from "@/server/config/admin.config";
import { authOptions } from "@/utils/authoptions";
import { routeTitles } from "@/utils/routes/routeTitles";

export const metadata: Metadata = {
    title: `${routeTitles.accountEditBaseInfo()} / Espace Membre`,
};

export default async function Page({
    params: { id },
}: {
    params: { id: string };
}) {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/login");
    }
    const username = session.user.id;
    const dbData = await getUserBasicInfo({ username: id });
    if (!dbData) {
        redirect("/community");
    }
    const userInfos = memberBaseInfoToModel(dbData);

    const startups = await getAllStartups();

    const startupOptions = startups.map((startup) => ({
        value: startup.uuid,
        label: startup.name || "",
    }));

    // if there is no current or future mission (or no mission at all)
    const hasActiveMission = !!userInfos.missions.find((m) =>
        m.end ? new Date(m.end) >= new Date() : !m.end,
    );

    const sessionUserIsFromIncubatorTeam =
        await isSessionUserIncubatorTeamAdminForUser({
            user: userInfos,
            sessionUserUuid: session.user.uuid,
        });
    // members cannot edit active users directly. Call admin or team member.
    if (
        hasActiveMission &&
        !session?.user.isAdmin &&
        !sessionUserIsFromIncubatorTeam
    ) {
        redirect(`/community/${id}`);
    }

    if (!userInfos) {
        redirect("/errors");
    }

    const props = {
        userInfos,
        startupOptions,
    };

    return (
        <>
            <MemberUpdate {...props} />
            <BreadCrumbFiller
                currentPage={userInfos.fullname}
                currentItemId={userInfos.username}
            />
        </>
    );
}
