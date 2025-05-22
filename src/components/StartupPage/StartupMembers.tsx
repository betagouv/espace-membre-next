import Accordion from "@codegouvfr/react-dsfr/Accordion";
import { Table } from "@codegouvfr/react-dsfr/Table";
import { fr } from "@codegouvfr/react-dsfr/fr";

import { memberBaseInfoSchemaType, memberSchemaType } from "@/models/member";

import { getLastMissionDate, getFirstMissionDate, hasActiveMissionInStartup, hasPreviousMissionInStartup } from "@/utils/member";
import { startupSchemaType } from "@/models/startup";

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
            data={members
                .sort((a, b) => a.fullname.localeCompare(b.fullname))
                .map((member: memberBaseInfoSchemaType, index: number) => [
                    <a key={index} href={`/community/${member.username}`}>
                        {member.fullname}
                    </a>,
                    member.role,
                    getFirstMissionDate(
                        member.missions.filter((mission) =>
                            (mission.startups || []).includes(startup_id)
                        )
                    ) || "",
                    getLastMissionDate(
                        member.missions.filter((mission) =>
                            (mission.startups || []).includes(startup_id)
                        )
                    ) || "",
                ])}
            headers={["Nom", "Role", "Date d'arrivée", "Date de fin"]}
        />
    );
}

export const StartupMembers = ({ startupInfos, members }:{startupInfos: startupSchemaType, members: }) => {
    const activeMembers = members.filter((member) =>
        hasActiveMissionInStartup(member, startupInfos.uuid)
    );

    const previousMembers = members
        .filter((member) =>hasPreviousMissionInStartup(member, startupInfos.uuid))
        .filter((member) => !activeMembers.map((member2) => member2.uuid).includes(member.uuid));

    return (
        <>
            <div className={fr.cx("fr-mb-2w")}>
                <a href={`mailto:${startupInfos.contact}`}>
                    <i className={fr.cx("fr-icon--sm", "fr-icon-mail-fill")} />{" "}
                    Contacter l'équipe
                </a>
            </div>
            {(activeMembers.length && (
                <Accordion
                    titleAs="h2"
                    label="Membres actifs"
                    expanded={true}
                    onExpandedChange={() => {}}
                >
                    <MemberTable
                        members={activeMembers}
                        startup_id={startupInfos.uuid}
                    />
                </Accordion>
            )) || (
                <div className={fr.cx("fr-my-4w")}>
                    <i
                        className={fr.cx("fr-icon--sm", "fr-icon-warning-fill")}
                    />{" "}
                    Aucun membre actif actuellement.
                </div>
            )}
            {(previousMembers.length && (
                <Accordion
                    titleAs="h2"
                    label="Anciens membres"
                    expanded={activeMembers.length === 0}
                    onExpandedChange={() => {}}
                >
                    <MemberTable
                        members={previousMembers}
                        startup_id={startupInfos.uuid}
                    />
                </Accordion>
            )) ||
                null}
        </>
    );
};
