"use client";

import { Tabs } from "@codegouvfr/react-dsfr/Tabs";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { fr } from "@codegouvfr/react-dsfr/fr";

import { matomoSiteSchemaType } from "@/models/matomoSite";
import { memberBaseInfoSchemaType } from "@/models/member";
import { sentryTeamSchemaType } from "@/models/sentryTeam";
import { phaseSchemaType, startupSchemaType } from "@/models/startup";
import { StartupChangeSchemaType } from "@/models/startupChange";
import { getStartupFiles } from "@/app/api/startups/files/list";
import { getCurrentPhase } from "@/utils/startup";

import "./timeline.css";
import { StartupHeader } from "./StartupHeader";
import { StartupMembers } from "./StartupMembers";
import { StartupDescription } from "./StartupDescription";
import { StartupHistory } from "./StartupHistory";
import { StartupStandards } from "./StartupStandards";
import { StartupTools } from "./StartupTools";
import { StartupFiles } from "../StartupFiles";

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
    events: {
        uuid: string;
        name: string;
        comment: string | null;
        startup_id: string | null;
        date: Date;
    }[];
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
    events,
}: StartupPageProps) {
    const currentPhase = getCurrentPhase(phases); // todo get current phase
    const tabs = [
        {
            label: "Équipe",
            isDefault: true,
            content: (
                <StartupMembers members={members} startupInfos={startupInfos} />
            ),
        },
        {
            label: "Description",
            content: <StartupDescription startupInfos={startupInfos} />,
        },
        {
            label: "Historique",
            content: <StartupHistory phases={phases} events={events} />,
        },
        {
            label: "Standards",
            content: <StartupStandards startupInfos={startupInfos} />,
        },
        {
            label: "Outils",
            content: (
                <StartupTools
                    matomoSites={matomoSites}
                    sentryTeams={sentryTeams}
                />
            ),
        },
        {
            label: "Documents",
            content: <StartupFiles startup={startupInfos} files={files} />,
        },
    ];

    return (
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
            <div className={fr.cx("fr-col-12")} style={{ textAlign: "center" }}>
                <Button
                    priority="secondary"
                    linkProps={{
                        href: `/startups/${startupInfos.uuid}/info-form`,
                    }}
                >
                    Modifier la fiche
                </Button>
            </div>
        </div>
    );
}
