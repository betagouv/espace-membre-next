import { Metadata, ResolvingMetadata } from "next";
import { redirect } from "next/navigation";

import StartupPage, {
    StartupPageProps,
} from "@/components/StartupPage/StartupPage";
import { db, jsonArrayFrom } from "@/lib/kysely";
import { getStartup } from "@/lib/kysely/queries";
import { getUserByStartup } from "@/lib/kysely/queries/users";
import { memberBaseInfoToModel, phaseToModel } from "@/models/mapper";
import { memberBaseInfoSchema, memberSchema } from "@/models/member";
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
        title: produit ? `Produit ${produit.ghid} / Espace Membre` : "",
    };
}

export default async function Page({ params }: Props) {
    const dbSe = await getStartup(params.id);
    if (!dbSe) {
        redirect("/startups");
    }
    const phases = (
        await db
            .selectFrom("phases")
            .selectAll()
            .where("startup_id", "=", dbSe.uuid)
            .execute()
    ).map((phase) => phaseToModel(phase));
    const startup = startupSchema.parse(dbSe);
    const startupMembers = (await getUserByStartup(params.id)).map((user) => {
        return memberBaseInfoToModel(user);
    });
    return (
        <StartupPage
            startupInfos={startup}
            members={startupMembers}
            phases={phases}
        />
    );
}
