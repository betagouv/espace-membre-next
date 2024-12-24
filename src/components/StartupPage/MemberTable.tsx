import { Table } from "@codegouvfr/react-dsfr/Table";

import { memberBaseInfoSchemaType } from "@/models/member";
import { getLastMissionDate } from "@/utils/member";

export function MemberTable({
    members,
    startup_id,
}: {
    members: memberBaseInfoSchemaType[];
    startup_id: string;
}) {
    return (
        <Table
            fixed
            data={members.map(
                (member: memberBaseInfoSchemaType, index: number) => [
                    <a key={index} href={`/community/${member.username}`}>
                        {member.fullname}
                    </a>,
                    member.role,
                    getLastMissionDate(
                        member.missions.filter((mission) =>
                            (mission.startups || []).includes(startup_id)
                        )
                    ) || "",
                ]
            )}
            headers={["Nom", "Role", "Date de fin"]}
        />
    );
}
