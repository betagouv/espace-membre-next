"use client";
import Accordion from "@codegouvfr/react-dsfr/Accordion";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import { Table } from "@codegouvfr/react-dsfr/Table";

import { memberBaseInfoSchemaType } from "@/models/member";
import { startupSchemaType } from "@/models/startup";

function MemberTable({ members }: { members: memberBaseInfoSchemaType[] }) {
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
                    "xx",
                    //member.end,
                ]
            )}
            headers={["Nom", "Role", "Date de fin"]}
        />
    );
}

export interface StartupPageProps {
    startupInfos: startupSchemaType;
    members: memberBaseInfoSchemaType[];
}

export default function StartupPage({
    startupInfos,
    members,
}: StartupPageProps) {
    const currentPhase = "todo get current phase"; // todo get current phase
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
                    <MemberTable members={activeMembers} />
                </Accordion>
                {/* <Accordion label="Membres expirés">
                    <MemberTable members={members.expired_members} />
                </Accordion> */}
                <Accordion label="Membres précédents">
                    <MemberTable members={previousMembers} />
                </Accordion>
            </div>
        </>
    );
}
