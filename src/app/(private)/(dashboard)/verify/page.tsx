import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import AccountVerifyClientPage from "./AccountVerifyClientPage";
import { getAllStartups } from "@/lib/kysely/queries";
import { getAllIncubatorsOptions } from "@/lib/kysely/queries/incubators";
import { getUserInfos } from "@/lib/kysely/queries/users";
import { userInfosToModel } from "@/models/mapper";
import { authOptions } from "@/utils/authoptions";
import { routeTitles } from "@/utils/routes/routeTitles";

export const metadata: Metadata = {
    title: `${routeTitles.verifyMember()} / Espace Membre`,
};

// async function fetchGithubPageData(username: string, ref: string = "master") {
//     const { attributes, body } = await fetchGithubMarkdown({
//         ref,
//         schema: memberSchema,
//         path: `content/_authors/${username}.md`,
//         // allow some empty fields on input for legacy. todo: move to zod preprocess ?
//         overrides: (values) => ({
//             domaine: values.domaine || [],
//             bio: values.body || "",
//             startups: values.startups || [],
//         }),
//     });

//     return {
//         ...attributes,
//     };
// }

export default async function AccountVerifyPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/login");
    }

    const username = session.user.id;

    // const formData = await fetchGithubPageData(username, "master");

    // const startups = await betagouv.startupsInfos();
    const startups = await getAllStartups();
    const member = userInfosToModel(await getUserInfos({ username }));
    // const missions = await db.selectFrom("missions").selectAll().execute();
    const startupOptions = startups.map((startup) => {
        return {
            value: startup.uuid,
            label: startup.name,
        };
    });
    const incubatorOptions = await getAllIncubatorsOptions();

    return (
        <AccountVerifyClientPage
            member={member}
            incubatorOptions={incubatorOptions}
            startupOptions={startupOptions}
        />
    );
}
