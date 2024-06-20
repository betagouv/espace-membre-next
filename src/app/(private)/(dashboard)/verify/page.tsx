import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import AccountVerifyClientPage, {
    AccountVerifyClientPageProps,
} from "./AccountVerifyClientPage";
import { fetchGithubMarkdown } from "@/lib/github";
import { db } from "@/lib/kysely";
import { getAllStartups } from "@/lib/kysely/queries";
import { getUserInfos } from "@/lib/kysely/queries/users";
import { userInfosToModel } from "@/models/mapper";
import { memberSchema } from "@/models/member";
import betagouv from "@/server/betagouv";
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

export default async function CreateMemberPage() {
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

    return (
        <AccountVerifyClientPage
            member={member}
            startupOptions={startupOptions}
        />
    );
}
