import { Metadata, ResolvingMetadata } from "next";

import StartupPage, {
    StartupPageProps,
} from "@/components/StartupPage/StartupPage";
import { getStartup } from "@/lib/kysely/queries";
import { getUserByStartup } from "@/lib/kysely/queries/users";
import { memberPublicInfoSchema, memberSchema } from "@/models/member";
import { startupSchema } from "@/models/startup";

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
    const dbSe = await getStartup(params.id);
    const startup = startupSchema.parse(dbSe);
    const startupMembers = (await getUserByStartup(params.id)).map((user) => {
        return memberPublicInfoSchema.parse(user);
    });
    console.log(startupMembers);

    return <StartupPage startupInfos={startup} members={startupMembers} />;
}
