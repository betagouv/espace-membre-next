import type { Metadata } from "next";

import { Community } from "@/components/CommunityPage";
import { competencesList } from "@/models/competences";
import { DOMAINE_OPTIONS } from "@/models/member";
import betagouv from "@/server/betagouv";
import { routeTitles } from "@/utils/routes/routeTitles";

export const metadata: Metadata = {
    title: `${routeTitles.community()} / Espace Membre`,
};

export default async function Page() {
    const users = await betagouv.usersInfos();
    const incubators = await betagouv.incubators();
    const startups = await betagouv.startupsInfos();
    const title = routeTitles.community();

    const props = {
        title,
        incubatorOptions: Object.keys(incubators).map((incubator) => {
            return {
                value: incubator,
                label: incubators[incubator].title,
            };
        }),
        startupOptions: startups.map((startup) => {
            return {
                value: startup.id,
                label: startup.attributes.name,
            };
        }),
        domaineOptions: DOMAINE_OPTIONS.map(({ key, name }) => ({
            value: key,
            label: name,
        })),
        competenceOptions: competencesList.map((c) => ({ value: c, label: c })),
        users,
    };

    return <Community {...props} />;
}
