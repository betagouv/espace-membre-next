import { Metadata, ResolvingMetadata } from "next";
import { redirect } from "next/navigation";

import TeamPage, { TeamPageProps } from "@/components/team/TeamPage/Team";
import { teamToModel } from "@/models/mapper";
import { memberBaseInfoSchema, memberSchema } from "@/models/member";
import { getTeam } from "@/lib/kysely/queries/teams";

type Props = {
    params: { id: string };
};

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    // read route params
    const id = params.id;

    const produit = await getTeam(id);
    return {
        title: produit ? `Produit ${produit.ghid} / Espace Membre` : "",
    };
}

export default async function Page({ params }: Props) {
    const dbTeam = await getTeam(params.id);
    if (!dbTeam) {
        redirect("/teams");
    }

    const team = teamToModel(dbTeam);
    return <TeamPage teamInfos={team} />;
}
