"use client";
import React from "react";

import SESelect from "@/components/SESelect";
import Input from "@codegouvfr/react-dsfr/Input";
import Button from "@codegouvfr/react-dsfr/Button";
import { useRouter } from "next/navigation";

interface Option {
    value: string;
    label: string;
}

export interface StartupListProps {
    startups: Option[];
}

/* Pure component */
export const StartupList = (props: StartupListProps) => {
    const [startup, setStartup] = React.useState("");
    const router = useRouter();
    const save = (event: { preventDefault: () => void }) => {
        event.preventDefault();
        router.push(`/startups/${startup}`);
    };
    return (
        <>
            <form onSubmit={save}>
                <SESelect
                    startups={props.startups}
                    onChange={(e: { value: React.SetStateAction<string> }) => {
                        setStartup(e.value);
                    }}
                    isMulti={false}
                    placeholder={"Sélectionne un produit"}
                />
                <Button
                    children="Voir ce produit"
                    nativeButtonProps={{
                        type: "submit",
                        disabled: !startup,
                    }}
                />
            </form>
            <br></br>
            <br></br>
            Pour créer une nouvelle fiche produit c'est ici :{" "}
            <a href="/startups/create-form">Créer une fiche produit</a>
        </>
    );
};
