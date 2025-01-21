"use client";

import { StartupPhase, PHASE_READABLE_NAME } from "@/models/startup";
import { frenchSmallDate } from "@/utils/date";
import { StartupPageProps } from "./StartupPage";
import { Table } from "@codegouvfr/react-dsfr/Table";

import "./timeline.css";

const getEventComment = (e) => {
    let comment = "";
    if (e.name === "committee") comment += "Comité d'investissement";
    if (e.name === "national_impact") comment += "Impact national ✨";
    if (e.name === "fast") comment += "FAST: ";
    if (e.comment) comment += e.comment;
    return comment;
};
export const StartupHistory = ({
    phases,
    events,
}: Pick<StartupPageProps, "phases" | "events">) => {
    return (
        <>
            <div className="startup-timeline">
                {Object.keys(StartupPhase).map((phase) => {
                    const startupPhase = phases.find(
                        (p) => p.name === StartupPhase[phase]
                    );
                    if (
                        (StartupPhase[phase] === "transfer" ||
                            StartupPhase[phase] === "alumni") &&
                        !startupPhase
                    )
                        return null; // n'affiche pas les phases de transfert et alumni si elles n'existent pas
                    return (
                        <p
                            className={`${startupPhase ? "active" : ""} ${
                                StartupPhase[phase]
                            }`}
                            key={phase}
                        >
                            <span className="fr-text--bold">
                                {PHASE_READABLE_NAME[StartupPhase[phase]]}
                            </span>
                            <br />
                            {startupPhase &&
                                frenchSmallDate(startupPhase.start)}
                        </p>
                    );
                })}
            </div>
            {(events.length && (
                <>
                    <h2>Évènements marquants</h2>
                    <Table
                        headers={["Date", "Description"]}
                        fixed
                        data={events.map((e) => [
                            frenchSmallDate(e.date),
                            getEventComment(e),
                        ])}
                    />
                </>
            )) ||
                null}
        </>
    );
};
