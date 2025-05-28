"use client";
import React from "react";

import AutoComplete, { OptionType } from "@/components/AutoComplete";
import { thematiques } from "@/models/thematiques";

type ThematiqueType = OptionType<false>;

const thematiquesMap: readonly ThematiqueType[] = thematiques.map(
    (thematique) =>
        ({
            label: thematique,
        }) as ThematiqueType,
);

export const ThematiquesEditor = ({
    onChange,
    defaultValue,
}: {
    onChange: (event: any, thematiques: string[]) => void;
    defaultValue: string[];
}) => {
    return (
        <AutoComplete
            id="thematique-editor"
            defaultValue={defaultValue.map((label) => ({ label }))}
            multiple
            freeSolo
            selectOnFocus={true}
            placeholder="Choisis une ou plusieurs thématiques"
            clearOnBlur={true}
            options={thematiquesMap}
            onSelect={(values, event) =>
                onChange(
                    event,
                    values.map((v) => v.label),
                )
            }
        />
    );
};
