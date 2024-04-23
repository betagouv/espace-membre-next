import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { BaseInfoUpdate } from "@/components/BaseInfoUpdatePage";
import { fetchGithubMarkdown, getPullRequestForBranch } from "@/lib/github";
import { memberSchema } from "@/models/member";
import { DBStartup, StartupInfo } from "@/models/startup";
import betagouv from "@/server/betagouv";
import config from "@/server/config";
import db from "@/server/db";
import { getAllStartups } from "@/server/db/dbStartup";
import { getDBUserAndMission } from "@/server/db/dbUser";
import { authOptions } from "@/utils/authoptions";
import { routeTitles } from "@/utils/routes/routeTitles";
import { getDBStartup } from "dist/src/server/db/dbStartup";

export const metadata: Metadata = {
    title: `${routeTitles.accountEditBaseInfo()} / Espace Membre`,
};

async function fetchGithubPageData(username: string, ref: string = "master") {
    const { attributes, body } = await fetchGithubMarkdown({
        ref,
        schema: memberSchema,
        path: `content/_authors/${username}.md`,
        // allow some empty fields on input for legacy. todo: move to zod preprocess ?
        overrides: (values, body) => ({
            domaine: values.domaine || [],
            bio: body || "",
            startups: values.startups || [],
        }),
    });

    return {
        ...attributes,
    };
}

export default async function Page() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/login");
    }

    const username = session.user.id;
    const authorPR = await getPullRequestForBranch(`edit-authors-${username}`);

    const sha = authorPR && authorPR.head.sha;
    const formData = await getDBUserAndMission(username); // fetchGithubPageData(username, sha || "master");
    const startups: DBStartup[] = await getAllStartups();
    const startupOptions = startups.map((startup) => ({
        value: startup.uuid,
        label: startup.name,
    }));
    if (!formData) {
        redirect("/errors");
    }
    const props = {
        formData: {
            ...formData,
            missions: formData.missions.map((m) => ({
                ...m,
                startups: m.startups.map((s) => s.uuid),
            })),
            startups: formData.startups || [],
        },
        startupOptions,
        updatePullRequest: authorPR,
    };
    console.log(props.formData);

    return <BaseInfoUpdate {...props} />;
}
