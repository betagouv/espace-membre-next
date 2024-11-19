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
        title: produit ? `Produit ${produit.ghid} / Espace Membre` : "",
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
    const startup = startupToModel(dbSe);
    const startupMembers = (await getUserByStartup(dbSe.uuid)).map((user) => {
        return memberBaseInfoToModel(user);
    });
    const changes = await getEventListByStartupUuid(startup.uuid);

    return (
        <>
            <BreadCrumbFiller
                currentPage={startup.name}
                currentItemId={startup.uuid}
            />
            <StartupPage
                changes={changes.map((change) => startupChangeToModel(change))}
                startupInfos={startup}
                members={startupMembers}
                phases={phases}
            />
        </>
    );
}
