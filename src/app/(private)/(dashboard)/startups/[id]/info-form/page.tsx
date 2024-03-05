import { Metadata, ResolvingMetadata } from "next";
import StartupPage, {
    StartupPageProps,
} from "@/components/StartupPage/StartupPage";
import {
    StartupInfoUpdate,
    StartupInfoUpdateProps,
} from "@/components/StartupInfoUpdatePage";

import yaml from "js-yaml";
import { redirect } from "next/navigation";

import { BaseInfoUpdate } from "@/components/BaseInfoUpdatePage";

import { startupSchema } from "@/models/startup";
import { routeTitles } from "@/utils/routes/routeTitles";
//import { StartupInfo } from "@/models/startup";
import betagouv from "@/server/betagouv";
import { getSessionFromStore } from "@/server/middlewares/sessionMiddleware";
import { cookies } from "next/headers";
import config from "@/server/config";
import StartupInfoFormClientPage from "./StartupInfoFormClientPage";
import { log } from "console";
import frontmatter from "front-matter";

type Props = {
    params: { id: string };
};

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    // read route params
    const id = params.id;

    return {
        title: `${routeTitles.startupDetailsEdit(id)} / Espace Membre`,
    };
}

async function fetchGithubPageData(startup: string, branch: string = "master") {
    // use source repo when sourcing original file, use fork for branches
    const repo =
        branch === "master" ? config.githubRepository : config.githubFork;
    const mdUrl = `https://raw.githubusercontent.com/${repo}/${branch}/content/_startups/${startup}.md`;
    console.log("mdUrl", mdUrl);
    const mdData = await fetch(mdUrl, { cache: "no-store" }).then((r) =>
        r.text()
    );

    const {
        attributes,
        body,
    }: { attributes: Record<string, any>; body: string } = frontmatter(mdData);

    const startupData = {
        ...attributes,
        id: startup,
    };

    const parsedData = startupSchema.parse(startupData);

    return {
        ...parsedData,
        markdown: body,
    };
}

// todo
const fetchGithubOptions = {
    headers: {
        Authorization: `token ${config.githubToken}`,
    },
};

async function getPullRequestForStartup(startup) {
    const pullRequests = await fetch(
        `https://api.github.com/repos/${
            config.githubRepository
        }/pulls?state=open&head=${
            config.githubFork.split("/")[0]
        }:edit-startup-${startup}&per_page=1`,
        fetchGithubOptions
    ).then((r) => r.json());

    return pullRequests.length && pullRequests[0];
}

export default async function Page(props) {
    const cookieStore = cookies();
    const session = (await getSessionFromStore(
        cookieStore.get(config.SESSION_COOKIE_NAME)
    )) as { id: string };
    if (!session) {
        redirect("/login");
    }
    const startup = props.params.id;
    const startupPR = await getPullRequestForStartup(startup);

    const sha = startupPR && startupPR.head.ref;
    const formData = await fetchGithubPageData(startup, sha || "master");

    const componentProps = {
        formData,
        updatePullRequest: startupPR && {
            url: startupPR.html_url,
        },
    };

    return <StartupInfoUpdate {...componentProps} />;
}
