import type { Metadata } from "next";

import { Incubators } from "@/@types/db";
import { Community } from "@/components/CommunityPage";
import { db } from "@/lib/kysely";
import { getAllStartups } from "@/lib/kysely/queries";
import { getAllUsersInfo } from "@/lib/kysely/queries/users";
import { competencesList } from "@/models/competences";
import { DOMAINE_OPTIONS } from "@/models/member";
import { routeTitles } from "@/utils/routes/routeTitles";

export const metadata: Metadata = {
    title: `${routeTitles.community()} / Espace Membre`,
};

export default async function Page() {
    const users = await getAllUsersInfo();
    const incubators = await db.selectFrom("incubators").selectAll().execute();
    const startups = await getAllStartups();
    const title = routeTitles.community();

    const props = {
        title,
        incubatorOptions: incubators.map((incubator) => {
            return {
                value: incubator.uuid,
                label: incubator.title,
            };
        }),
        startupOptions: startups.map((startup) => {
            return {
                value: startup.uuid,
                label: startup.name,
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
