import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { BaseInfoUpdate } from "@/components/BaseInfoUpdatePage";
import { getUserInfos, getAllStartups } from "@/lib/kysely/queries";
import { DomaineSchemaType } from "@/models/member";
import { authOptions } from "@/utils/authoptions";
import { routeTitles } from "@/utils/routes/routeTitles";
import { MemberType } from "@/models/dbUser";

export const metadata: Metadata = {
    title: `${routeTitles.accountEditBaseInfo()} / Espace Membre`,
};

export default async function Page() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/login");
    }
    const username = session.user.id;
    const userInfos = await getUserInfos({ username });

    const startups = await getAllStartups();
    const startupOptions = startups.map((startup) => ({
        value: startup.uuid,
        label: startup.name || "",
    }));
    if (!userInfos) {
        redirect("/errors");
    }

    // todo: to make TS happy
    const domaine = userInfos.domaine as DomaineSchemaType;
    const memberType = userInfos.memberType as MemberType;

    const props = {
        formData: {
            ...userInfos,
            memberType,
            domaine,
        },
        startupOptions,
    };

    return <BaseInfoUpdate {...props} />;
}
