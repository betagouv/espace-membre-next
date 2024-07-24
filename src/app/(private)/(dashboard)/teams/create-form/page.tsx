import { Metadata } from "next";

import { TeamCreate } from "@/components/team/TeamCreatePage";
import { db } from "@/lib/kysely";
import { getAllUsersInfo } from "@/lib/kysely/queries/users";
import { memberBaseInfoToModel } from "@/models/mapper";
import { routeTitles } from "@/utils/routes/routeTitles";
export const metadata: Metadata = {
    title: `${routeTitles.teamCreate()} / Espace Membre`,
};

export default async function Page(props) {
    const incubators = await db.selectFrom("incubators").selectAll().execute(); //await betagouv.sponsors();
    const members = (await getAllUsersInfo()).map((member) =>
        memberBaseInfoToModel(member)
    );

    return (
        <>
            <h1>{routeTitles.teamCreate()}</h1>
            <TeamCreate
                members={members}
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
