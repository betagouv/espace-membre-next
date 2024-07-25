import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { IncubatorUpdate } from "@/components/IncubatorUpdatePage";
import { db } from "@/lib/kysely";
import { incubatorToModel } from "@/models/mapper";
import { authOptions } from "@/utils/authoptions";
import { routeTitles } from "@/utils/routes/routeTitles";
import { getIncubator } from "@/lib/kysely/queries/incubators";

type Props = {
    params: { id: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    // read route params
    const id = params.id;
    const incubator = await getIncubator(id);

    return {
        title: `${routeTitles.incubatorDetailsEdit(
            incubator?.title
        )} / Espace Membre`,
    };
}

export default async function Page(props: Props) {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/login");
    }
    const uuid = props.params.id;
    const dbIncubator = await db
        .selectFrom("incubators")
        .selectAll()
        .where("uuid", "=", uuid)
        .executeTakeFirst();
    if (!dbIncubator) {
        redirect("/incubators");
    }
    const sponsors = await db.selectFrom("organizations").selectAll().execute(); //await betagouv.sponsors();

    const incubator = incubatorToModel(dbIncubator);
    const componentProps = {
        incubator,
        sponsorOptions: sponsors.map((incubator) => {
            return {
                value: incubator.uuid,
                label: incubator.name,
            };
        }),
    };

    return <IncubatorUpdate {...componentProps} />;
}
