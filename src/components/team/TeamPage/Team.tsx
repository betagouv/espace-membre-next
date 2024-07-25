"use client";

import Button from "@codegouvfr/react-dsfr/Button";

import { incubatorSchemaType } from "@/models/incubator";
import { memberPublicInfoSchemaType } from "@/models/member";
import { teamSchemaType } from "@/models/team";

export interface TeamPageProps {
    teamInfos: teamSchemaType;
    teamMembers: memberPublicInfoSchemaType[];
    incubator: incubatorSchemaType;
}

export default function TeamPage({
    teamInfos,
    teamMembers,
    incubator,
}: TeamPageProps) {
    return (
        <>
            <div className="fr-mb-8v">
                <h1>{teamInfos.name}</h1>

                <h2>Incubateur :</h2>
                {incubator.title}
                <br />
                <br />
                <h2>Mission : </h2>
                {teamInfos.mission ? `${teamInfos.mission}` : "Non renseigné"}
                <br />
                <br />

                <h2>Membres : </h2>
                {!!teamMembers.length && (
                    <ul>
                        {teamMembers.map((member) => (
                            <li key={member.uuid}>
                                {member.fullname}, {member.role}
                            </li>
                        ))}
                    </ul>
                )}
                {!teamMembers.length && (
                    <p>
                        Il n'y a pas encore de membre dans cette équipe. Tu peux
                        en ajouter en éditant la fiche.
                    </p>
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