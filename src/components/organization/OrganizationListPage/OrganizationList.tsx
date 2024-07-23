"use client";
import React from "react";

import Button from "@codegouvfr/react-dsfr/Button";
import { useRouter } from "next/navigation";

import SESponsorSelect from "@/components/SESponsorSelect";
import { Option } from "@/models/misc";

export interface OrganizationListProps {
    organizationOptions: Option[];
}

/* Pure component */
export const OrganizationList = (props: OrganizationListProps) => {
    const [organization, setOrganization] = React.useState("");
    const router = useRouter();
    const save = (event: { preventDefault: () => void }) => {
        event.preventDefault();
        router.push(`/organizations/${organization}`);
    };
    return (
        <>
            <form onSubmit={save}>
                <SESponsorSelect
                    isMulti={false}
                    label="Sponsor/Organisations"
                    placeholder="Sélectionne une organisation sponsor"
                    allSponsors={props.organizationOptions}
                    onChange={(organization) => {
                        if (organization) {
                            setOrganization(organization);
                        }
                    }}
                />
                <Button
                    children="Voir cette organisation"
                    nativeButtonProps={{
                        type: "submit",
                        disabled: !organization,
                    }}
                />
            </form>
            <br></br>
            <br></br>
            Pour créer une nouvelle fiche organisation sponsor c'est ici :{" "}
            <a href="/organizations/create-form">
                Créer une fiche organisation sponsor
            </a>
        </>
    );
};
