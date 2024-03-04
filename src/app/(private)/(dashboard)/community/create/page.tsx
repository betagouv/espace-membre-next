import yaml from "js-yaml";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import CommunityCreateMemberPage from "./CommunityCreateMemberPage";
import { StartupInfo } from "@/models/startup";
import betagouv from "@/server/betagouv";
import config from "@/server/config";
import { getSessionFromStore } from "@/server/middlewares/sessionMiddleware";
import { routeTitles } from "@/utils/routes/routeTitles";

export const metadata: Metadata = {
    title: `${routeTitles.communityCreateMember()} / Espace Membre`,
};

export default async function CreateMemberPage() {
    const cookieStore = cookies();
    const session = (await getSessionFromStore(
        cookieStore.get(config.SESSION_COOKIE_NAME)
    )) as { id: string };
    if (!session) {
        redirect("/login");
    }

    const username = session.id;

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
