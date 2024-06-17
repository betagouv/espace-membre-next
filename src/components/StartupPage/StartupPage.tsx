"use client";
import Accordion from "@codegouvfr/react-dsfr/Accordion";
import Button from "@codegouvfr/react-dsfr/Button";
import { Table } from "@codegouvfr/react-dsfr/Table";
import { format } from "date-fns";
import { fr } from "date-fns/locale/fr";

import { memberBaseInfoSchemaType } from "@/models/member";
import { missionSchemaType } from "@/models/mission";
import {
    PHASES_ORDERED_LIST,
    phaseSchemaType,
    startupSchemaType,
} from "@/models/startup";

const getLastMissionDate = (missions: missionSchemaType[]): string | null => {
    const latestMission = missions.reduce((a, v) =>
        //@ts-ignore todo
        !v.end || v.end > a.end ? v : a
    );
    if (latestMission && latestMission.end) {
        return format(latestMission.end, "d MMMM yyyy", { locale: fr });
    }
    return null;
};

const getCurrentPhase = (phases: phaseSchemaType[]): string | null => {
    if (!phases.length) {
        return `Il n'y a pas de phase renseignée`;
    }
    const sorted = phases.sort(
        (phaseA, phaseB) =>
            PHASES_ORDERED_LIST.indexOf(phaseB.name) -
            PHASES_ORDERED_LIST.indexOf(phaseA.name)
    );

    return sorted[0].name;
};

function MemberTable({
    members,
    startup_id,
}: {
    members: memberBaseInfoSchemaType[];
    startup_id: string;
}) {
    return (
        <Table
            data={members.map(
                (member: memberBaseInfoSchemaType, index: number) => [
                    <a
                        key={index}
                        target="_blank"
                        href={`https://github.com/betagouv/beta.gouv.fr/edit/master/content/_authors/${member.username}.md`}
                    >
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

export interface StartupPageProps {
    startupInfos: startupSchemaType;
    members: memberBaseInfoSchemaType[];
    phases: phaseSchemaType[];
}

export default function StartupPage({
    startupInfos,
    members,
    phases,
}: StartupPageProps) {
    const currentPhase = getCurrentPhase(phases); // todo get current phase
    const activeMembers = members.filter((member) =>
        member.missions.find(
            (m) =>
                m.startups?.includes(startupInfos.uuid) &&
                (!m.end || m.end >= new Date())
        )
    );
    const previousMembers = members.filter((member) =>
        member.missions.find(
            (m) =>
                m.startups?.includes(startupInfos.uuid) &&
                m.end &&
                m.end < new Date()
        )
    );
    return (
        <>
            <div className="fr-mb-8v">
                <h1>{startupInfos.name}</h1>
                <p>
                    <span>
                        Fiche GitHub :{" "}
                        <a
                            className="fr-link"
                            target="_blank"
                            href={`https://github.com/betagouv/beta.gouv.fr/edit/master/content/_startups/${startupInfos.ghid}.md`}
                        >
                            {startupInfos.name}
                        </a>
                    </span>
                    <br />
                    <span>
                        Repository :{" "}
                        <a
                            className="fr-link"
                            target="_blank"
                            href={startupInfos.repository}
                        >
                            {startupInfos.repository}
                        </a>
                    </span>
                    <br />
                    <span>
                        Contact :{" "}
                        {startupInfos.contact && (
                            <a href={`mailto:${startupInfos.contact}`}>
                                {startupInfos.contact}
                            </a>
                        )}
                    </span>
                    <br />
                    <span>Phase : {currentPhase}</span>
                    <br />
                </p>
                <p className="fr-text--sm" style={{ fontStyle: "italic" }}>
                    Une informations n'est pas à jour ?
                </p>
                <Button
                    linkProps={{
                        href: `/startups/${startupInfos.uuid}/info-form`,
                    }}
                >
                    ✏️ Mettre à jour les infos
                </Button>
            </div>

            <div className="fr-mb-4v">
                <h3>Membres</h3>
                <Accordion
                    label="Membres actuels"
                    expanded={true}
                    onExpandedChange={(expanded, e) => {}}
                >
                    <MemberTable
                        members={activeMembers}
                        startup_id={startupInfos.uuid}
                    />
                </Accordion>
                {/* <Accordion label="Membres expirés">
                    <MemberTable members={members.expired_members} />
                </Accordion> */}
                <Accordion label="Membres précédents">
                    <MemberTable
                        members={previousMembers}
                        startup_id={startupInfos.uuid}
                    />
                </Accordion>
            </div>
        </>
    );
}
