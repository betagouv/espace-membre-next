import type { Metadata } from "next";
import { z } from "zod";
import { routeTitles } from "@/utils/routes/routeTitles";
import { memberSchema } from "@/models/member";
import yaml from "js-yaml";
import { BaseInfoUpdate } from "@/components/BaseInfoUpdatePage";
import { NextRequest } from "next/server";

export const metadata: Metadata = {
    title: `${routeTitles.accountEditBaseInfo()} / Espace Membre`,
};

const fetchGithubPageData = (username): Promise<z.infer<typeof memberSchema>> =>
    fetch(
        `https://raw.githubusercontent.com/betagouv/beta.gouv.fr/master/content/_authors/${username}.md`
    )
        .then((r) => r.text())
        .then((body) => yaml.loadAll(body))
        .then((data) => {
            const [metadata, body] = data;
            return { ...metadata, bio: body };
        });

export default async function Page(req: NextRequest, res) {
    console.log(req, res);
    const username = "";
    const metadata = await fetchGithubPageData(username);

    return <BaseInfoUpdate metadata={metadata} />;
}
