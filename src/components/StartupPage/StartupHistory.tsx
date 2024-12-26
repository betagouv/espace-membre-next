"use client";

import { StartupPhase, PHASE_READABLE_NAME } from "@/models/startup";
import { frenchSmallDate } from "@/utils/date";
import { StartupPageProps } from "./StartupPage";
import { Table } from "@codegouvfr/react-dsfr/Table";

import "./timeline.css";

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
                    const color = startupPhase
                        ? ["success", "transfer"].includes(StartupPhase[phase])
                            ? "success"
                            : "active"
                        : "";
                    if (
                        (StartupPhase[phase] === "transfer" ||
                            StartupPhase[phase] === "alumni") &&
                        !startupPhase
                    )
                        return null;
                    return (
                        <p className={color} key={phase}>
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
                            e.comment,
                        ])}
                    />
                </>
            )) ||
                null}
        </>
    );
};
