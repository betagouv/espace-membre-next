"use client";
import React from "react";

import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { useRouter } from "next/navigation";

import SESelect from "@/components/SESelect";
import { Option } from "@/models/misc";


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
            <form onSubmit={save} class="fr-mb-2w">
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

            <p><a class="fr-btn fr-btn--secondary" href="/startups/create-form">Créer une nouvelle fiche produit</a></p>
        </>
    );
};
