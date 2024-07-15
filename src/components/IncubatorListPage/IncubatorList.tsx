"use client";
import React from "react";

import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { useRouter } from "next/navigation";

import SEIncubateurSelect from "../SEIncubateurSelect";
import SESelect from "@/components/SESelect";
import { Option } from "@/models/misc";

export interface IncubatorListProps {
    incubators: Option[];
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
                    incubators={props.incubators}
                    onChange={(e, incubator) => {
                        console.log(e, incubator);
                        setIncubator(incubator.id);
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
            <br></br>
            <br></br>
            Pour créer une nouvelle fiche incubateur c'est ici :{" "}
            <a href="/incubators/create-form">Créer une fiche incubateur</a>
        </>
    );
};
