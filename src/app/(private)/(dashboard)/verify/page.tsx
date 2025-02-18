import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import AccountVerifyClientPage from "./AccountVerifyClientPage";
import { getAllStartups } from "@/lib/kysely/queries";
import { getUserInfos } from "@/lib/kysely/queries/users";
import { userInfosToModel } from "@/models/mapper";
import { authOptions } from "@/utils/authoptions";
import { routeTitles } from "@/utils/routes/routeTitles";

export const metadata: Metadata = {
    title: `${routeTitles.verifyMember()} / Espace Membre`,
};

export default async function AccountVerifyPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/login");
    }

    const username = session.user.id;

    const startups = await getAllStartups();
    const member = userInfosToModel(await getUserInfos({ username }));
    const startupOptions = startups.map((startup) => {
        return {
            value: startup.uuid,
            label: startup.name,
        };
    });

    return (
        <AccountVerifyClientPage
            member={member}
            startupOptions={startupOptions}
        />
    );
}
