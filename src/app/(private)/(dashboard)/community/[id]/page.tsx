import type { Metadata, ResolvingMetadata } from "next";
import CommunityIdClientPage from "./CommunityIdClientPage";

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
        title: `Espace-Membre : membre ${id}`,
    };
}

export default function Page(props) {
    return <CommunityIdClientPage {...props} />;
}
