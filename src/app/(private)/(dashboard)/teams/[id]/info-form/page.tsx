import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { BreadCrumbFiller } from "@/app/BreadCrumbProvider";

import { TeamUpdate } from "@/components/team/TeamUpdatePage";
import { db } from "@/lib/kysely";
import { getTeam } from "@/lib/kysely/queries/teams";
import {
    getAllUsersInfo,
    MEMBER_PROTECTED_INFO,
} from "@/lib/kysely/queries/users";
import {
    memberBaseInfoToModel,
    memberPublicInfoToModel,
    teamToModel,
} from "@/models/mapper";
import { authOptions } from "@/utils/authoptions";
import { routeTitles } from "@/utils/routes/routeTitles";

type Props = {
    params: { id: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    // read route params
    const id = params.id;
    const team = await getTeam(id);

    return {
        title: `${routeTitles.teamDetailsEdit(team?.name)} / Espace Membre`,
    };
}

export default async function Page(props: Props) {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/login");
    }

    //todo
    const uuid = props.params.id;
    const dbTeam = await getTeam(uuid);

    if (!dbTeam) {
        redirect("/teams");
    }
    const incubators = await db.selectFrom("incubators").selectAll().execute(); //await betagouv.sponsors();
    const members = (await getAllUsersInfo()).map((member) =>
        memberPublicInfoToModel(member)
    );
    const teamMembers = members.filter((m) =>
        m.teams.map((t) => t.uuid).includes(uuid)
    );

    const team = teamToModel(dbTeam);
    const componentProps = {
        team,
        incubatorOptions: incubators.map((team) => {
            return {
                value: team.uuid,
                label: team.title,
            };
        }),
        members,
        teamMembers,
    };

    return (
        <>
            <BreadCrumbFiller
                currentPage={team.name}
                currentItemId={team.uuid}
            />
            <TeamUpdate {...componentProps} />
        </>
    );
}
