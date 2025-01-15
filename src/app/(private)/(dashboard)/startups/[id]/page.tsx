import { Metadata, ResolvingMetadata } from "next";
import { redirect } from "next/navigation";
import { validate } from "uuid";

import { BreadCrumbFiller } from "@/app/BreadCrumbProvider";
import StartupPage from "@/components/StartupPage/StartupPage";
import { getEventListByStartupUuid } from "@/lib/events";
import { db } from "@/lib/kysely";
import { getStartup } from "@/lib/kysely/queries";
import { getUserByStartup } from "@/lib/kysely/queries/users";
import {
    memberBaseInfoToModel,
    phaseToModel,
    startupChangeToModel,
    startupToModel,
} from "@/models/mapper";
import { getStartupFiles } from "@/app/api/startups/files/list";

type Props = {
    params: { id: string };
};

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    // read route params
    let query: { ghid: string } | { uuid: string } = {
        ghid: params.id,
    };
    if (validate(params.id)) {
        query = {
            uuid: params.id,
        };
    }
    const produit = await getStartup(query);
    return {
        title: produit ? `${produit.name} / Espace Membre` : "",
    };
}

export default async function Page({ params }: Props) {
    let query: { ghid: string } | { uuid: string } = {
        ghid: params.id,
    };
    if (validate(params.id)) {
        query = {
            uuid: params.id,
        };
    }

    const dbSe = await getStartup(query);
    if (!dbSe) {
        redirect("/startups");
    }
    const phases = (
        await db
            .selectFrom("phases")
            .selectAll()
            .where("startup_id", "=", dbSe.uuid)
            .execute()
    ).map((phase) => phaseToModel(phase));
    const incubator = await db
        .selectFrom("incubators")
        .select([
            "incubators.title",
            "incubators.short_description",
            "incubators.ghid",
            "incubators.uuid",
        ])
        .where("uuid", "=", dbSe.incubator_id)
        .executeTakeFirstOrThrow();
    const sponsors = await db
        .selectFrom("organizations")
        .leftJoin(
            "startups_organizations",
            "startups_organizations.organization_id",
            "organizations.uuid"
        )
        .select([
            "organizations.name",
            "organizations.acronym",
            "organizations.uuid",
        ])
        .where("startups_organizations.startup_id", "=", dbSe.uuid)
        .execute();
    const sentryTeams = await db
        .selectFrom("sentry_teams")
        .where("startup_id", "=", params.id)
        .selectAll()
        .execute();
    const matomoSites = await db
        .selectFrom("matomo_sites")
        .where("startup_id", "=", params.id)
        .selectAll()
        .execute();
    const startup = startupToModel(dbSe);
    const startupMembers = (await getUserByStartup(dbSe.uuid)).map((user) => {
        return memberBaseInfoToModel(user);
    });
    const changes = await getEventListByStartupUuid(startup.uuid);
    const files = await getStartupFiles({ uuid: startup.uuid });
    const events = await db
        .selectFrom("startup_events")
        .where("startup_id", "=", startup.uuid)
        .selectAll()
        .orderBy("date", "asc")
        .execute();
    return (
        <>
            <BreadCrumbFiller
                currentPage={startup.name}
                currentItemId={startup.uuid}
            />
            <StartupPage
                changes={changes.map((change) => startupChangeToModel(change))}
                startupInfos={startup}
                incubator={incubator}
                sponsors={sponsors}
                sentryTeams={sentryTeams}
                matomoSites={matomoSites}
                members={startupMembers}
                phases={phases}
                files={files}
                events={events}
            />
        </>
    );
}
