import { Metadata, ResolvingMetadata } from "next";
import StartupIdClientPage from "./StartupIdClientPage";

type Props = {
    params: { id: string };
};

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    // read route params
    const id = params.id;

    return {
        title: `Produit ${id} / Espace Membre`,
    };
}

export default function Page(props) {
    return <StartupIdClientPage {...props} />;
}
