import { Metadata, ResolvingMetadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import * as Sentry from "@sentry/node";

import { getSessionFromStore } from "@/server/middlewares/sessionMiddleware";
import config from "@/server/config";
import { StartupInfoUpdate } from "@/components/StartupInfoUpdatePage";
import { startupSchema } from "@/models/startup";
import { routeTitles } from "@/utils/routes/routeTitles";
import { getPullRequestForBranch, fetchGithubMarkdown } from "@/lib/github";

type Props = {
    params: { id: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    // read route params
    const id = params.id;
    return {
        title: `${routeTitles.startupDetailsEdit(id)} / Espace Membre`,
    };
}

async function fetchGithubPageData(startup: string, ref: string = "master") {
    const { attributes, body } = await fetchGithubMarkdown({
        ref,
        schema: startupSchema,
        path: `content/_startups/${startup}.md`,
        overrides: (values) => ({
            ...values,
            // prevent exceptions with invalid markdown content
            title: values.title || "",
            mission: values.mission || "",
            incubator: values.incubator || "",
            contact: values.contact || "",
        }),
    });

    return {
        ...attributes,
        markdown: body,
    };
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
    const startupPR = await getPullRequestForBranch(`edit-startup-${startup}`);

    const sha = startupPR && startupPR.head.sha;
    const formData = await fetchGithubPageData(startup, sha || "master");

    const componentProps = {
        formData,
        updatePullRequest: startupPR,
    };

    return <StartupInfoUpdate {...componentProps} />;
}
