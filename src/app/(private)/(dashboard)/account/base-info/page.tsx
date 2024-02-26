import type { Metadata } from "next";
import yaml from "js-yaml";
import { redirect } from "next/navigation";

import { BaseInfoUpdate } from "@/components/BaseInfoUpdatePage";

import { memberSchema } from "@/models/member";
import { routeTitles } from "@/utils/routes/routeTitles";
import { StartupInfo } from "@/models/startup";
import betagouv from "@/server/betagouv";
import { getSessionFromStore } from "@/server/middlewares/sessionMiddleware";
import db from "@/server/db";
import { PULL_REQUEST_STATE } from "@/models/pullRequests";
import { cookies } from "next/headers";
import config from "@/server/config";

export const metadata: Metadata = {
    title: `${routeTitles.accountEditBaseInfo()} / Espace Membre`,
};

const fetchGithubPageData = (username: string, branch: string) => {
    return fetch(
        `https://raw.githubusercontent.com/betagouv/beta.gouv.fr/master/content/_authors/${username}.md`
    )
        .then((r) => r.text())
        .then((content) => {
            const documents = yaml.loadAll(content, null, {
                schema: yaml.JSON_SCHEMA,
            });
            const [metadata, body]: any[] = documents;
            return memberSchema.parse({
                ...metadata,
                bio: body || "", // prevent validation error if bio=null
                startups: metadata.startups || [],
            });
        });
};

async function getPullRequestForUsername(username: string) {
    return await db("pull_requests")
        .where({
            username: username,
            status: PULL_REQUEST_STATE.PR_MEMBER_UPDATE_CREATED,
        })
        .orderBy("created_at", "desc")
        .first();
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
    const updatePullRequest = await getPullRequestForUsername(username);
    const formData = await fetchGithubPageData(username, "master");
    const startups: StartupInfo[] = await betagouv.startupsInfos();
    const startupOptions = startups.map((startup) => {
        return {
            value: startup.id,
            label: startup.attributes.name,
        };
    });
    const props = {
        formData,
        startupOptions,
        updatePullRequest,
    };

    return <BaseInfoUpdate {...props} />;
}
