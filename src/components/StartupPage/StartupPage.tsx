"use client";

import { ReactElement } from "react";
import Accordion from "@codegouvfr/react-dsfr/Accordion";
import { Table } from "@codegouvfr/react-dsfr/Table";
import { Tabs } from "@codegouvfr/react-dsfr/Tabs";
import { fr } from "@codegouvfr/react-dsfr/fr";
import MarkdownIt from "markdown-it";

import { matomoSiteSchemaType } from "@/models/matomoSite";
import { memberBaseInfoSchemaType } from "@/models/member";
import { sentryTeamSchemaType } from "@/models/sentryTeam";
import {
    phaseSchemaType,
    StartupPhase,
    startupSchemaType,
} from "@/models/startup";
import { StartupChangeSchemaType } from "@/models/startupChange";
import { getCurrentPhase } from "@/utils/startup";
import { StartupHeader } from "./StartupHeader";
import { MemberTable } from "./MemberTable";
import { getStartupFiles } from "@/app/api/startups/files/list";
import { StartupFiles } from "../StartupFiles";
import { Badge } from "@codegouvfr/react-dsfr/Badge";

const mdParser = new MarkdownIt(/* Markdown-it options */);

export interface StartupPageProps {
    startupInfos: startupSchemaType;
    members: memberBaseInfoSchemaType[];
    phases: phaseSchemaType[];
    changes: StartupChangeSchemaType[];
    sentryTeams: sentryTeamSchemaType[];
    matomoSites: matomoSiteSchemaType[];
    incubator: {
        title: string;
        uuid: string;
        ghid: string | null;
        short_description: string | null;
    };
    sponsors: {
        uuid: string;
        name: string;
        acronym: string | null;
    }[];
    files: Awaited<ReturnType<typeof getStartupFiles>>;
}

export default function StartupPage({
    startupInfos,
    members,
    phases,
    changes,
    matomoSites,
    sentryTeams,
    incubator,
    sponsors,
    files,
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

    const tabs = [
        {
            label: "Équipe",
            isDefault: true,
            content: (
                <>
                    <div className={fr.cx("fr-mb-2w")}>
                        <a href={`mailto:${startupInfos.contact}`}>
                            <i
                                className={fr.cx(
                                    "fr-icon--sm",
                                    "fr-icon-mail-fill"
                                )}
                            />{" "}
                            Contacter l'équipe
                        </a>
                    </div>
                    {(activeMembers.length && (
                        <MemberTable
                            members={activeMembers}
                            startup_id={startupInfos.uuid}
                        />
                    )) || (
                        <div className={fr.cx("fr-my-4w")}>
                            <i
                                className={fr.cx(
                                    "fr-icon--sm",
                                    "fr-icon-warning-fill"
                                )}
                            />{" "}
                            Aucun membre actif actuellement.
                        </div>
                    )}
                    {(previousMembers.length && (
                        <Accordion
                            label="Anciens membres"
                            expanded={true}
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
            ),
        },
        {
            label: "Description",
            content: (
                <>
                    <Table
                        headers={["Nom", "Valeur"]}
                        data={[
                            startupInfos.link && [
                                "URL du produit",
                                <a href={startupInfos.link} target="_blank">
                                    {startupInfos.link}
                                </a>,
                            ],
                            [
                                "Fiche beta.gouv.fr",
                                <a
                                    href={`https://beta.gouv.fr/startups/${startupInfos.ghid}`}
                                    target="_blank"
                                >
                                    https://beta.gouv.fr/startups/
                                    {startupInfos.ghid}
                                </a>,
                            ],
                            startupInfos.repository && [
                                "Code source",
                                <a
                                    href={startupInfos.repository}
                                    target="_blank"
                                >
                                    {startupInfos.repository}
                                </a>,
                            ],

                            [
                                "Contact",
                                <a href={`mailtor:${startupInfos.contact}`}>
                                    {startupInfos.contact}
                                </a>,
                            ],
                        ].filter((x) => !!x)}
                    />
                    <div
                        dangerouslySetInnerHTML={{
                            __html: mdParser.render(startupInfos.description),
                        }}
                    />
                </>
            ),
        },
        {
            label: "Historique",
            content: "[TODO]",
        },
        {
            label: "Standards",
            content: "[TODO]",
        },
        {
            label: "Outils",
            content: (
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
                    <Accordion
                        label="Sentry"
                        expanded={true}
                        onExpandedChange={(expanded, e) => {}}
                    >
                        {!sentryTeams.length && (
                            <p>
                                Aucun équipe sentry n'est connecté à ce produit
                            </p>
                        )}
                        {!!sentryTeams.length && (
                            <Table
                                data={sentryTeams.map((site) => [site.name])}
                                headers={["nom de l'équipe"]}
                            ></Table>
                        )}
                    </Accordion>
                </div>
            ),
        },
        {
            label: "Documents",
            content: (
                <>
                    <StartupFiles startup={startupInfos} files={files} />
                </>
            ),
        },
    ];

    return (
        <>
            <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
                <StartupHeader
                    startupInfos={startupInfos}
                    changes={changes}
                    incubator={incubator}
                    sponsors={sponsors}
                    currentPhase={currentPhase}
                />

                <div className={fr.cx("fr-col-12")}>
                    <Tabs tabs={tabs}></Tabs>
                </div>
            </div>
        </>
    );
}
