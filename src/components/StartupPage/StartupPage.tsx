"use client";
import Accordion from "@codegouvfr/react-dsfr/Accordion";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import { Table } from "@codegouvfr/react-dsfr/Table";

import LastChange from "../LastChange";
import { matomoSiteSchemaType } from "@/models/matomoSite";
import { memberBaseInfoSchemaType } from "@/models/member";
import { sentryTeamSchemaType } from "@/models/sentryTeam";
import { phaseSchemaType, startupSchemaType } from "@/models/startup";
import { StartupChangeSchemaType } from "@/models/startupChange";
import { getLastMissionDate } from "@/utils/member";
import { getCurrentPhase } from "@/utils/startup";

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

export interface StartupPageProps {
    startupInfos: startupSchemaType;
    members: memberBaseInfoSchemaType[];
    phases: phaseSchemaType[];
    changes: StartupChangeSchemaType[];
    sentryTeams: sentryTeamSchemaType[];
    matomoSites: matomoSiteSchemaType[];
}

export default function StartupPage({
    startupInfos,
    members,
    phases,
    changes,
    matomoSites,
    sentryTeams,
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
                <LastChange changes={changes} />
                <p>
                    <span>
                        Fiche GitHub :{" "}
                        <a
                            className="fr-link"
                            target="_blank"
                            href={`https://github.com/betagouv/beta.gouv.fr/blob/master/content/_startups/${startupInfos.ghid}.md`}
                        >
                            {startupInfos.name}
                        </a>
                    </span>
                    <br />
                    <span>
                        Repository :{" "}
                        {startupInfos.repository ? (
                            <a
                                className="fr-link"
                                target="_blank"
                                href={startupInfos.repository}
                            >
                                {startupInfos.repository}
                            </a>
                        ) : (
                            "Non renseigné"
                        )}
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
                    Une information n'est pas à jour ?
                </p>
                <ButtonsGroup
                    inlineLayoutWhen="always"
                    buttons={[
                        {
                            children: "Mettre à jour les infos",
                            iconId: "fr-icon-edit-fill",
                            linkProps: {
                                href: `/startups/${startupInfos.uuid}/info-form`,
                            },
                        },
                        {
                            children: "Gérer les documents",
                            iconId: "fr-icon-file-add-line",
                            linkProps: {
                                href: `/startups/${startupInfos.uuid}/files`,
                            },
                            priority: "secondary",
                        },
                    ]}
                ></ButtonsGroup>
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
                <Accordion label="Membres précédents">
                    <MemberTable
                        members={previousMembers}
                        startup_id={startupInfos.uuid}
                    />
                </Accordion>
            </div>
            <div className="fr-mb-4v">
                <h3>Outils</h3>
                <Accordion
                    label="Matomo"
                    expanded={true}
                    onExpandedChange={(expanded, e) => {}}
                >
                    {!matomoSites.length && (
                        <p>Aucun site matomo n'est connecté à ce produit</p>
                    )}
                    {!!matomoSites.length && (
                        <Table
                            data={matomoSites.map((site) => [
                                site.name,
                                site.url,
                                site.type,
                            ])}
                            headers={["nom du site", "url", "type"]}
                        ></Table>
                    )}
                </Accordion>
                <Accordion label="Sentry">
                    {!sentryTeams.length && (
                        <p>Aucun équipe sentry n'est connecté à ce produit</p>
                    )}
                    {!!sentryTeams.length && (
                        <Table
                            data={sentryTeams.map((site) => [site.name])}
                            headers={["nom de l'équipe"]}
                        ></Table>
                    )}
                </Accordion>
            </div>
        </>
    );
}
