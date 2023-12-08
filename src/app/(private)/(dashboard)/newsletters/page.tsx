import { Metadata, ResolvingMetadata } from "next";
import NewsletterClientPage from "./NewsletterClientPage";

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
        title: `Infolettre / Espace Membre`,
    };
}

export default function Page(props) {
    return <NewsletterClientPage {...props} />;
}
