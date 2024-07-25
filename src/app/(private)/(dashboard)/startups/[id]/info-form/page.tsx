import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { StartupInfoUpdate } from "@/components/StartupInfoUpdatePage";
import { db } from "@/lib/kysely";
import { getStartup } from "@/lib/kysely/queries";
import { startupToModel } from "@/models/mapper";
import { sponsorSchema } from "@/models/sponsor";
import { eventSchema, phaseSchema } from "@/models/startup";
import { authOptions } from "@/utils/authoptions";
import { routeTitles } from "@/utils/routes/routeTitles";

type Props = {
    params: { id: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    // read route params
    const id = params.id;
    const startup = await getStartup(id);

    return {
        title: `${routeTitles.startupDetailsEdit(
            startup?.name
        )} / Espace Membre`,
    };
}

export default async function Page(props) {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/login");
    }
    const uuid = props.params.id;

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
    const startupEvents = z
        .array(eventSchema)
        .parse(
            await db
                .selectFrom("startup_events")
                .where("startup_events.startup_id", "=", startup.uuid)
                .selectAll()
                .execute()
        );
    const componentProps = {
        startup,
        startupSponsors,
        startupPhases,
        startupEvents,
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
