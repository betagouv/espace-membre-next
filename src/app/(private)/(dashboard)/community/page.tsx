import type { Metadata } from "next";

import { Community } from "@/components/CommunityPage";
import { db } from "@/lib/kysely";
import { getAllStartups } from "@/lib/kysely/queries";
import {
    getAllIncubatorsOptions,
    getAllIncubatorsMembers,
} from "@/lib/kysely/queries/incubators";
import { getAllUsersInfo } from "@/lib/kysely/queries/users";
import { competencesList } from "@/models/competences";
import { memberBaseInfoToModel } from "@/models/mapper";
import { DOMAINE_OPTIONS } from "@/models/member";
import { routeTitles } from "@/utils/routes/routeTitles";

export const metadata: Metadata = {
    title: `${routeTitles.community()} / Espace Membre`,
};

export default async function Page() {
    const users = (await getAllUsersInfo()).map((member) =>
        memberBaseInfoToModel(member)
    );
    const incubatorOptions = await getAllIncubatorsOptions();
    const startups = await getAllStartups();
    const title = routeTitles.community();

    const incubatorMembers = await getAllIncubatorsMembers();
    const props = {
        title,
        incubatorOptions: incubatorOptions,
        incubatorMembers: incubatorMembers,
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
