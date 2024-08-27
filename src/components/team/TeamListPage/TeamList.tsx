"use client";
import React from "react";

import Button from "@codegouvfr/react-dsfr/Button";
import { useRouter } from "next/navigation";

import TeamSelect from "../../TeamSelect";
import { Option } from "@/models/misc";

export interface TeamListProps {
    teamOptions: Option[];
}

/* Pure component */
export const TeamList = (props: TeamListProps) => {
    const [team, setTeam] = React.useState("");
    const router = useRouter();
    const save = (event: { preventDefault: () => void }) => {
        event.preventDefault();
        router.push(`/teams/${team}`);
    };
    return (
        <>
            <form onSubmit={save}>
                <TeamSelect
                    label="Équipes"
                    placeholder="Sélectionne un équipe"
                    teamOptions={props.teamOptions}
                    onChange={(e, team) => {
                        if (team) {
                            setTeam(team.value);
                        }
                    }}
                    isMulti={false}
                />
                <Button
                    children="Voir cette équipe"
                    nativeButtonProps={{
                        type: "submit",
                        disabled: !team,
                    }}
                />
            </form>
            <br>
            <p><a class="fr-btn fr-btn--secondary" href="/teams/create-form">Créer une nouvelle fiche équipe</a></p>
        </>
    );
};
