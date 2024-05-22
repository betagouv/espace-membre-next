import { Metadata, ResolvingMetadata } from "next";

import StartupIdClientPage from "./StartupIdClientPage";
import StartupPage, {
    StartupPageProps,
} from "@/components/StartupPage/StartupPage";
import { getStartup, getStartupDetails } from "@/lib/kysely/queries";

type Props = {
    params: { id: string };
};

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    // read route params
    const id = params.id;

    const produit = await getStartup(id);
    return {
        title: produit ? `Produit ${produit.id} / Espace Membre` : "",
    };
}

export default async function Page({ params }: Props) {
    const produit = await getStartupDetails(params.id);
    console.log(produit);
    return <StartupPage {...(produit as StartupPageProps)} />;
}
