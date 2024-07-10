import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { StartupInfoUpdate } from "@/components/StartupInfoUpdatePage";
import { getPullRequestForBranch, fetchGithubMarkdown } from "@/lib/github";
import { db } from "@/lib/kysely";
import { startupToModel } from "@/models/mapper";
import { sponsorSchema } from "@/models/sponsor";
import { phaseSchema, startupSchema } from "@/models/startup";
import { thematiques } from "@/models/thematiques";
import { usertypes } from "@/models/usertypes";
import betagouv from "@/server/betagouv";
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
            // prevent some exceptions with invalid content
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
    const uuid = props.params.id;
    // const startupPR = await getPullRequestForBranch(`edit-startup-${id}`);

    // const sha = startupPR && startupPR.head.sha;
    // const formData = await fetchGithubPageData(id, sha || "master");
    const incubators = await db.selectFrom("incubators").selectAll().execute(); //await betagouv.incubators();
    const sponsors = await db.selectFrom("organizations").selectAll().execute(); //await betagouv.sponsors();
    const startup = startupToModel(
        await db
            .selectFrom("startups")
            .selectAll()
            .where("uuid", "=", uuid)
            .executeTakeFirst()
    );
    if (!startup) {
        redirect("/startups");
    }
    const startupSponsors = z
        .array(sponsorSchema)
        .parse(
            await db
                .selectFrom("organizations")
                .leftJoin(
                    "startups_organizations",
                    "organization_id",
                    "organizations.uuid"
                )
                .where("startup_id", "=", startup.uuid)
                .select([
                    "organizations.uuid",
                    "organizations.acronym",
                    "organizations.type",
                    "organizations.domaine_ministeriel",
                    "organizations.ghid",
                    "organizations.name",
                ])
                .execute()
        );
    const startupPhases = z
        .array(phaseSchema)
        .parse(
            await db
                .selectFrom("phases")
                .where("startup_id", "=", startup.uuid)
                .selectAll()
                .execute()
        );
    const componentProps = {
        startup,
        startupSponsors,
        startupPhases,
        incubatorOptions: incubators.map((incubator) => {
            return {
                value: incubator.uuid,
                label: incubator.title,
            };
        }),
        sponsorOptions: sponsors.map((incubator) => {
            return {
                value: incubator.uuid,
                label: incubator.name,
            };
        }),
    };

    return <StartupInfoUpdate {...componentProps} />;
}
