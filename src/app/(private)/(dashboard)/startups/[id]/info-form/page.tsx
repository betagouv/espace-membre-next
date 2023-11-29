import { Metadata, ResolvingMetadata } from "next";
import StartupInfoFormClientPage from "./StartupInfoFormClientPage";
import { routeTitles } from "@/utils/routes/routeTitles";

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
        title: `${routeTitles.startupDetailsEdit(id)} / Espace Membre`,
    };
}

export default function Page(props) {
    return <StartupInfoFormClientPage {...props} />;
}
