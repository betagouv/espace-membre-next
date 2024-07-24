"use client";

import Button from "@codegouvfr/react-dsfr/Button";

import { teamSchemaType } from "@/models/team";

export interface TeamPageProps {
    teamInfos: teamSchemaType;
}

export default function TeamPage({ teamInfos }: TeamPageProps) {
    return (
        <>
            <div className="fr-mb-8v">
                <h1>{teamInfos.name}</h1>
                <p>
                    <br />
                    <span>
                        Mission :{" "}
                        {teamInfos.mission
                            ? `${teamInfos.mission}`
                            : "Non renseigné"}
                    </span>
                    <br />
                </p>
                <p className="fr-text--sm" style={{ fontStyle: "italic" }}>
                    Une information n'est pas à jour ?
                </p>
                <Button
                    linkProps={{
                        href: `/teams/${teamInfos.uuid}/info-form`,
                    }}
                >
                    ✏️ Mettre à jour les infos
                </Button>
            </div>
        </>
    );
}
