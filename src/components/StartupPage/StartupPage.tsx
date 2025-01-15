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
import LastChange from "../LastChange";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
    const router = useRouter();
    const [hash, setHash] = useState<null | string>(null);

    // Optional: Listen for hash changes
    const onHashChange = () => {
        setHash(window.location.hash.replace("#", ""));
    };

    useEffect(() => {
        if (window.location.hash) {
            setHash(window.location.hash.replace("#", ""));
        } else {
            setHash(tabs[0].tabId);
        }
        window.addEventListener("hashchange", onHashChange);

        return () => {
            window.removeEventListener("hashchange", onHashChange);
        };
    }, []);

    const currentPhase = getCurrentPhase(phases); // todo get current phase
    const tabs = [
        {
            label: "Équipe",
            tabId: "team",
            isDefault: hash === "team",
            content: (
                <StartupMembers members={members} startupInfos={startupInfos} />
            ),
        },
        {
            label: "Description",
            tabId: "description",
            isDefault: hash === "description",
            content: <StartupDescription startupInfos={startupInfos} />,
        },
        {
            label: "Historique",
            tabId: "events",
            isDefault: hash === "events",
            content: <StartupHistory phases={phases} events={events} />,
        },
        {
            label: "Standards",
            tabId: "standards",
            isDefault: hash === "standards",
            content: <StartupStandards startupInfos={startupInfos} />,
        },
        {
            label: "Outils",
            tabId: "tools",
            isDefault: hash === "tools",
            content: (
                <StartupTools
                    matomoSites={matomoSites}
                    sentryTeams={sentryTeams}
                />
            ),
        },
        {
            label: "Documents",
            tabId: "documents",
            isDefault: hash === "documents",
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
                {hash && (
                    <Tabs
                        tabs={tabs}
                        onTabChange={(obj) => {
                            router.push(`#${tabs[obj.tabIndex].tabId}`);
                        }}
                    ></Tabs>
                )}
            </div>
            <div
                className={fr.cx("fr-col-12", "fr-mt-4w")}
                style={{ textAlign: "center" }}
            >
                <Button
                    priority="secondary"
                    linkProps={{
                        href: `/startups/${startupInfos.uuid}/info-form`,
                    }}
                >
                    Modifier la fiche
                </Button>
                <br />
                <br />
                <LastChange changes={changes} />
            </div>
        </div>
    );
}
