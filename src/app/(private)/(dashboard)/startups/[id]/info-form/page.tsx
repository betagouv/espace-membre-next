import { Metadata, ResolvingMetadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import betagouv from "@/server/betagouv";

import { StartupInfoUpdate } from "@/components/StartupInfoUpdatePage";
import { getPullRequestForBranch, fetchGithubMarkdown } from "@/lib/github";
import { startupSchema } from "@/models/startup";
import { authOptions } from "@/utils/authoptions";
import { routeTitles } from "@/utils/routes/routeTitles";

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
            sponsors:
                (values.sponsors &&
                    values.sponsors.map((sponsor) =>
                        sponsor.replace(/^\/organisations\//, "")
                    )) ||
                [],
        }),
    });

    return {
        ...attributes,
        markdown: body,
    };
}

export default async function Page(props) {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/login");
    }
    const startup = props.params.id;
    const startupPR = await getPullRequestForBranch(`edit-startup-${startup}`);

    const sha = startupPR && startupPR.head.sha;
    const formData = await fetchGithubPageData(startup, sha || "master");
    const incubators = await betagouv.incubators();
    const componentProps = {
        formData,
        incubators,
        updatePullRequest: startupPR,
    };

    return <StartupInfoUpdate {...componentProps} />;
}
