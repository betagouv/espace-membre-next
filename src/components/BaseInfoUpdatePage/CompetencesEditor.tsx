"use client";
import React from "react";

import { fr } from "@codegouvfr/react-dsfr";
import Autocomplete, { createFilterOptions } from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

import { competences } from "@/models/competences";

interface CompetenceType {
    inputValue?: string;
    group?: string;
    label: string;
}
const competencesMap: readonly CompetenceType[] = Object.keys(
    competences
).flatMap((key) =>
    competences[key].map((competence) => ({
        group: key,
        label: competence,
    }))
);

const filter = createFilterOptions<CompetenceType>();

//  from https://mui.com/material-ui/react-autocomplete/#creatable
export const CompetencesEditor = ({
    onChange,
    defaultValue,
    placeholder = "Choisissez ou ajoutez vos compétences",
}: {
    onChange: (event: any, competences: string[]) => void;
    defaultValue: string[];
    placeholder?: string;
}) => {
    const [value, setValue] = React.useState<CompetenceType[]>(
        defaultValue.map((t) => ({ label: t } as CompetenceType))
    );

    return (
        <Autocomplete
            value={value}
            multiple={true}
            selectOnFocus={true}
            clearOnBlur={true}
            options={competencesMap}
            groupBy={(option) => option.group || "Autres"}
            renderGroup={(params) => (
                <li key={params.key}>
                    <div
                        className={fr.cx("fr-p-1w", "fr-text--heavy")}
                        style={{
                            backgroundColor:
                                fr.colors.options.blueEcume._850_200.default,
                        }}
                    >
                        {params.group}
                    </div>
                    <ul>{params.children}</ul>
                </li>
            )}
            onChange={(event, newValues) => {
                const newValue = newValues.length
                    ? newValues[newValues.length - 1]
                    : null;
                if (typeof newValue === "string") {
                    // touche entrée
                    if (!value.map((v) => v.label).includes(newValue)) {
                        const values = [...value, { label: newValue }];
                        setValue(values);
                        onChange(
                            event,
                            values.map((v) => v.inputValue || v.label)
                        );
                    }
                } else if (newValue && newValue.inputValue) {
                    // Create a new value from the user input
                    if (
                        !value.map((v) => v.label).includes(newValue.inputValue)
                    ) {
                        const values = [
                            ...value,
                            { label: newValue.inputValue },
                        ];
                        setValue(values);
                        onChange(
                            event,
                            values.map((v) => v.inputValue || v.label)
                        );
                    }
                } else if (Array.isArray(newValues)) {
                    const convertedValues: CompetenceType[] = newValues
                        .filter((newValue, i) => {
                            // remove duplicates
                            if (typeof newValue === "string") {
                                return !newValues
                                    .slice(i + 1)
                                    .map((v) => v.label)
                                    .includes(newValue);
                            } else {
                                return !newValues
                                    .slice(i + 1)
                                    .map((v) => v.label)
                                    .includes(newValue.label);
                            }
                        })
                        .map((newValue) => {
                            if (typeof newValue === "string") {
                                // Convert string to CompetenceType
                                return { label: newValue };
                            } else {
                                // Already in the correct format
                                return newValue;
                            }
                        });
                    setValue(convertedValues);

                    // Send changes upstream
                    onChange(
                        event,
                        convertedValues.map((v) => v.inputValue || v.label)
                    );
                }
            }}
            filterOptions={(options, params) => {
                const filtered = filter(options, params);

                const { inputValue } = params;
                const isExisting = options.some(
                    (option) =>
                        inputValue.toLowerCase() === option.label.toLowerCase()
                );
                if (inputValue !== "" && !isExisting) {
                    filtered.push({
                        inputValue,
                        label: `Ajouter "${inputValue}"`, // doesnt work ;/
                    });
                }

                return filtered;
            }}
            getOptionLabel={(option) => {
                if (typeof option === "string") {
                    // touchée entrée
                    return option;
                }
                if (option.inputValue) {
                    return option.inputValue;
                }
                return option.label;
            }}
            renderInput={(params) => (
                <TextField
                    {...params}
                    inputProps={{
                        ...params.inputProps,
                        style: {
                            padding: `0.75rem 0.5rem`,
                        },
                    }}
                    variant="standard"
                    style={{
                        paddingLeft: 10,
                        borderRadius: `0.25rem 0.25rem 0 0`,
                        backgroundColor: `var(--background-contrast-grey)`,
                        boxShadow: `inset 0 -2px 0 0 var(--border-plain-grey)`,
                    }}
                    placeholder={placeholder}
                />
            )}
        />
    );
};
