import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { TeamUpdate } from "@/components/team/TeamUpdatePage";
import { db } from "@/lib/kysely";
import { teamToModel } from "@/models/mapper";
import { authOptions } from "@/utils/authoptions";
import { routeTitles } from "@/utils/routes/routeTitles";

type Props = {
    params: { id: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    // read route params
    const id = params.id;
    return {
        title: `${routeTitles.teamDetailsEdit(id)} / Espace Membre`,
    };
}

export default async function Page(props: Props) {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/login");
    }
    const uuid = props.params.id;
    const dbTeam = await db
        .selectFrom("teams")
        .selectAll()
        .where("uuid", "=", uuid)
        .executeTakeFirst();
    if (!dbTeam) {
        redirect("/teams");
    }
    const incubators = await db.selectFrom("incubators").selectAll().execute(); //await betagouv.sponsors();

    const team = teamToModel(dbTeam);
    const componentProps = {
        team,
        incubatorOptions: incubators.map((team) => {
            return {
                value: team.uuid,
                label: team.title,
            };
        }),
    };

    return <TeamUpdate {...componentProps} />;
}
