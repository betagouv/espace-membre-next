"use client";
import React from "react";


import Button from "@codegouvfr/react-dsfr/Button";
import { useRouter } from "next/navigation";

import SEIncubateurSelect from "../SEIncubateurSelect";
import { Option } from "@/models/misc";

export interface IncubatorListProps {
    incubatorOptions: Option[];
}

/* Pure component */
export const IncubatorList = (props: IncubatorListProps) => {
    const [incubator, setIncubator] = React.useState("");
    const router = useRouter();
    const save = (event: { preventDefault: () => void }) => {
        event.preventDefault();
        router.push(`/incubators/${incubator}`);
    };
    return (
        <>
            <form onSubmit={save}>
                <SEIncubateurSelect
                    label="Incubateurs"
                    placeholder="Sélectionne un incubateur"
                    incubatorOptions={props.incubatorOptions}
                    onChange={(e, incubator) => {
                        if (incubator) {
                            setIncubator(incubator.value);
                        }
                    }}
                    isMulti={false}
                />
                <Button
                    children="Voir cet incubateur"
                    nativeButtonProps={{
                        type: "submit",
                        disabled: !incubator,
                    }}
                />
            </form>
            <br>
            <p><a class="fr-btn" href="/incubators/create-form">Créer une nouvelle fiche incubateur</a></p>
        </>
    );
};
