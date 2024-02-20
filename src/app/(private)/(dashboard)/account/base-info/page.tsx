import type { Metadata } from "next";
import yaml from "js-yaml";
import { redirect } from "next/navigation";

import { BaseInfoUpdate } from "@/components/BaseInfoUpdatePage";

import { memberSchema } from "@/models/member";
import { routeTitles } from "@/utils/routes/routeTitles";
import { StartupInfo } from "@/models/startup";
import betagouv from "@/server/betagouv";
import { getSessionFromStore } from "@/server/middlewares/sessionMiddleware";
import { cookies } from "next/headers";
import config from "@/server/config";

export const metadata: Metadata = {
    title: `${routeTitles.accountEditBaseInfo()} / Espace Membre`,
};

async function fetchGithubPageData(
    username: string,
    branch: string = "master"
) {
    // use source repo when sourcing original file, use fork for branches
    const repo =
        branch === "master" ? config.githubRepository : config.githubFork;
    const mdUrl = `https://raw.githubusercontent.com/${repo}/${branch}/content/_authors/${username}.md`;
    const mdData = await fetch(mdUrl, { cache: "no-store" }).then((r) =>
        r.text()
    );

    const [metadata, body]: any[] = yaml.loadAll(mdData, null, {
        schema: yaml.JSON_SCHEMA,
    });
    const member = {
        ...metadata,
        domaine: metadata.domaine || [], // allow some empty fields on input for legacy
        bio: body,
    };
    return memberSchema.parse(member);
}

// todo
const fetchGithubOptions = {
    headers: {
        Authorization: `token ${config.githubToken}`,
    },
};

async function getPullRequestForAuthor(username) {
    const pullRequests = await fetch(
        `https://api.github.com/repos/${
            config.githubRepository
        }/pulls?state=open&head=${
            config.githubFork.split("/")[0]
        }:edit-authors-${username}&per_page=1`,
        fetchGithubOptions
    ).then((r) => r.json());

    return pullRequests.length && pullRequests[0];
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
    const authorPR = await getPullRequestForAuthor(username);

    const sha = authorPR && authorPR.head.ref;
    const formData = await fetchGithubPageData(username, sha || "master");
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
        updatePullRequest: authorPR && {
            url: authorPR.html_url,
        },
    };

    return <BaseInfoUpdate {...props} />;
}
