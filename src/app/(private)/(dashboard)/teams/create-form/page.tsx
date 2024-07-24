import { Metadata } from "next";

import { TeamCreate } from "@/components/team/TeamCreatePage";
import { db } from "@/lib/kysely";
import { routeTitles } from "@/utils/routes/routeTitles";

export const metadata: Metadata = {
    title: `${routeTitles.teamCreate()} / Espace Membre`,
};

export default async function Page(props) {
    const incubators = await db.selectFrom("incubators").selectAll().execute(); //await betagouv.sponsors();

    return (
        <>
            <h1>{routeTitles.teamCreate()}</h1>
            <TeamCreate
                incubatorOptions={incubators.map((team) => {
                    return {
                        value: team.uuid,
                        label: team.title,
                    };
                })}
                {...props}
            />
        </>
    );
}
