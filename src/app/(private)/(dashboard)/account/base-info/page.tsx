import type { Metadata } from "next";
import { NextRequest } from "next/server";
import { z } from "zod";
import yaml from "js-yaml";

import { BaseInfoUpdate } from "@/components/BaseInfoUpdatePage";

import { memberSchema } from "@/models/member";
import { routeTitles } from "@/utils/routes/routeTitles";
import { StartupInfo } from "@/models/startup";
import betagouv from "@/server/betagouv";
import config from "@/server/config";

export const metadata: Metadata = {
    title: `${routeTitles.accountEditBaseInfo()} / Espace Membre`,
};

const fetchGithubPageData = (username: string) =>
    fetch(
        `https://raw.githubusercontent.com/betagouv/beta.gouv.fr/master/content/_authors/${username}.md`
    )
        .then((r) => r.text())
        .then((content) => {
            const documents = yaml.loadAll(content);
            const [metadata, body]: any[] = documents;
            return memberSchema.parse({
                ...metadata,
                bio: body,
            });
        });

export default async function Page(req, res) {
    // todo: updatePullRequest
    // todo: auth
    const username = "julien.dauphant"; //todo
    const formData = await fetchGithubPageData(req.user.id);
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
    };

    return <BaseInfoUpdate {...props} />;
}
