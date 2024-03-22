import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { BaseInfoUpdate } from "@/components/BaseInfoUpdatePage";
import { fetchGithubMarkdown, getPullRequestForBranch } from "@/lib/github";
import { memberSchema } from "@/models/member";
import { StartupInfo } from "@/models/startup";
import betagouv from "@/server/betagouv";
import config from "@/server/config";
import db from "@/server/db";
import { getSessionFromStore } from "@/server/middlewares/sessionMiddleware";
import { routeTitles } from "@/utils/routes/routeTitles";

export const metadata: Metadata = {
    title: `${routeTitles.accountEditBaseInfo()} / Espace Membre`,
};

async function fetchGithubPageData(username: string, ref: string = "master") {
    const { attributes, body } = await fetchGithubMarkdown({
        ref,
        schema: memberSchema,
        path: `content/_authors/${username}.md`,
        // allow some empty fields on input for legacy. todo: move to zod preprocess ?
        overrides: (values) => ({
            domaine: values.domaine || [],
            bio: values.body || "",
            startups: values.startups || [],
        }),
    });

    return {
        ...attributes,
    };
}

export default async function Page() {
    const cookieStore = cookies();
    const session = (await getSessionFromStore(
        cookieStore.get(config.SESSION_COOKIE_NAME)
    )) as { id: string };
    if (!session) {
        redirect("/login");
    }

    const username = session.id;
    const authorPR = await getPullRequestForBranch(`edit-authors-${username}`);

    const sha = authorPR && authorPR.head.sha;
    const formData = await fetchGithubPageData(username, sha || "master");
    const startups: StartupInfo[] = await betagouv.startupsInfos();
    const startupOptions = startups.map((startup) => ({
        value: startup.id,
        label: startup.attributes.name,
    }));

    const props = {
        formData,
        startupOptions,
        updatePullRequest: authorPR,
    };

    return <BaseInfoUpdate {...props} />;
}
