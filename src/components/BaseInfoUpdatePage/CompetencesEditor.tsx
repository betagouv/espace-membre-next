"use client";
import React from "react";

import AutoComplete, { OptionType } from "@/components/AutoComplete";
import { competences } from "@/models/competences";

type CompetenceType = OptionType<true> & {
    id: string;
};

const competencesMap: readonly CompetenceType[] = Object.keys(
    competences
).flatMap((key) =>
    competences[key].map((competence) => ({
        group: key,
        label: competence,
    }))
);

export const CompetencesEditor = ({
    onChange,
    defaultValue,
    placeholder = "Choisissez ou ajoutez vos compétences",
    freeSolo = true,
}: {
    onChange: (event: any, competences: string[]) => void;
    defaultValue: string[];
    placeholder?: string;
    freeSolo?: boolean;
}) => {
    return (
        <AutoComplete
            freeSolo={freeSolo}
            defaultValue={defaultValue.map(
                (label) => ({ label } as CompetenceType)
            )}
            multiple
            groupOptions
            options={competencesMap}
            placeholder={placeholder}
            onSelect={(values, event) => {
                onChange(
                    event,
                    values.map((v) => v.label)
                );
            }}
        />
    );
};
