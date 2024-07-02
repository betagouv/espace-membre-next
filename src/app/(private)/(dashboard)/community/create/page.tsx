import type { Metadata } from "next";

import CommunityCreateMemberPage from "./CommunityCreateMemberPage";
import { getAllStartups } from "@/lib/kysely/queries";
import { routeTitles } from "@/utils/routes/routeTitles";

export const metadata: Metadata = {
    title: `${routeTitles.communityCreateMember()} / Espace Membre`,
};

export default async function CreateMemberPage() {
    const startups = await getAllStartups();
    const startupOptions = startups.map((startup) => ({
        value: startup.uuid,
        label: startup.name || "",
    }));

    const props = {
        startupOptions,
    };

    return <CommunityCreateMemberPage {...props} />;
}
