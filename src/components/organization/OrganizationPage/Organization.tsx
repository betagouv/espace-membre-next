"use client";

import Button from "@codegouvfr/react-dsfr/Button";

import { sponsorSchemaType } from "@/models/sponsor";

export interface OrganizationPageProps {
    organizationInfos: sponsorSchemaType;
}

export default function OrganizationPage({
    organizationInfos,
}: OrganizationPageProps) {
    return (
        <>
            <div className="fr-mb-8v">
                <h1>{organizationInfos.name}</h1>
                <p>
                    <span>Acronyme : {organizationInfos.acronym}</span>
                    <br />
                    <span>
                        Domaine ministeriel :{" "}
                        {organizationInfos.domaine_ministeriel}
                    </span>
                    <br />
                    <span>Type de sponsor : {organizationInfos.type}</span>
                    <br />
                </p>
                <p className="fr-text--sm" style={{ fontStyle: "italic" }}>
                    Une information n'est pas à jour ?
                </p>
                <Button
                    linkProps={{
                        href: `/organizations/${organizationInfos.uuid}/info-form`,
                    }}
                >
                    ✏️ Mettre à jour les infos
                </Button>
            </div>
        </>
    );
}
