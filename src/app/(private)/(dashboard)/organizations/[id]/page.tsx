import { Metadata, ResolvingMetadata } from "next";
import { redirect } from "next/navigation";

import OrganizationPage from "@/components/organization/OrganizationPage/Organization";
import { getOrganization } from "@/lib/kysely/queries/organizations";
import { organizationToModel } from "@/models/mapper";

type Props = {
    params: { id: string };
};

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    // read route params
    const id = params.id;

    const produit = await getOrganization(id);
    return {
        title: produit ? `Produit ${produit.ghid} / Espace Membre` : "",
    };
}

export default async function Page({ params }: Props) {
    const dbOrganization = await getOrganization(params.id);
    if (!dbOrganization) {
        redirect("/organizations");
    }

    const organization = organizationToModel(dbOrganization);
    return <OrganizationPage organizationInfos={organization} />;
}
