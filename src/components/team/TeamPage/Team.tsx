"use client";

import Button from "@codegouvfr/react-dsfr/Button";

import { memberPublicInfoSchemaType } from "@/models/member";
import { teamSchemaType } from "@/models/team";

export interface TeamPageProps {
    teamInfos: teamSchemaType;
    teamMembers: memberPublicInfoSchemaType[];
}

export default function TeamPage({ teamInfos, teamMembers }: TeamPageProps) {
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
                <h2>Membres : </h2>
                {teamMembers.length && (
                    <ul>
                        {teamMembers.map((member) => (
                            <li key={member.uuid}>
                                {member.fullname}, {member.role}
                            </li>
                        ))}
                    </ul>
                )}
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
