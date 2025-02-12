import type { Metadata } from "next";

import CommunityCreateMemberPage from "./CommunityCreateMemberPage";
import { getAllStartups } from "@/lib/kysely/queries";
import { getAllIncubatorsOptions } from "@/lib/kysely/queries/incubators";
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
    const incubatorOptions = await getAllIncubatorsOptions();

    const props = {
        startupOptions,
        incubatorOptions,
    };

    return <CommunityCreateMemberPage {...props} />;
}
