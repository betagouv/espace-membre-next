import { Metadata, ResolvingMetadata } from "next";
import { redirect } from "next/navigation";

import IncubatorPage, {
    IncubatorPageProps,
} from "@/components/IncubatorPage/IncubatorPage";
import { getIncubator } from "@/lib/kysely/queries/incubators";
import { incubatorToModel } from "@/models/mapper";
import { memberBaseInfoSchema, memberSchema } from "@/models/member";

type Props = {
    params: { id: string };
};

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    // read route params
    const id = params.id;

    const produit = await getIncubator(id);
    return {
        title: produit ? `Incubateur ${produit.ghid} / Espace Membre` : "",
    };
}

export default async function Page({ params }: Props) {
    const dbIncubator = await getIncubator(params.id);
    if (!dbIncubator) {
        redirect("/incubators");
    }

    const incubator = incubatorToModel(dbIncubator);
    return <IncubatorPage incubatorInfos={incubator} />;
}
