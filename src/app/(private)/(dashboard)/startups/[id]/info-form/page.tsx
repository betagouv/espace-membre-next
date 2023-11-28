import { Metadata, ResolvingMetadata } from "next";
import StartupInfoFormClientPage from "./StartupInfoFormClientPage";

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
        title: `Espace-Membre : éditer ${id}`,
    };
}

export default function Page(props) {
    return <StartupInfoFormClientPage {...props} />;
}
