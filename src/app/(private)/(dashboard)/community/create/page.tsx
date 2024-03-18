import type { Metadata } from "next";

import CommunityCreateMemberPage from "./CommunityCreateMemberPage";
import { StartupInfo } from "@/models/startup";
import betagouv from "@/server/betagouv";
import { routeTitles } from "@/utils/routes/routeTitles";

export const metadata: Metadata = {
    title: `${routeTitles.communityCreateMember()} / Espace Membre`,
};

export default async function CreateMemberPage() {
    const startups: StartupInfo[] = await betagouv.startupsInfos();
    const startupOptions = startups.map((startup) => {
        return {
            value: startup.id,
            label: startup.attributes.name,
        };
    });

    const props = {
        startupOptions,
    };

    return <CommunityCreateMemberPage {...props} />;
}
