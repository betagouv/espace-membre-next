"use client";
import React from "react";

import Autocomplete, { createFilterOptions } from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { competences } from "@/models/competences";
import { fr } from "@codegouvfr/react-dsfr";

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
}: {
    onChange: any;
    defaultValue: string[];
}) => {
    // display value
    const [value, setValue] = React.useState<CompetenceType | null>(null);

    return (
        <Autocomplete
            defaultValue={defaultValue.map(
                (t) => ({ label: t } as CompetenceType)
            )}
            freeSolo
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
            onChange={(event, newValue) => {
                if (typeof newValue === "string") {
                    //  pass
                    setValue({
                        label: newValue,
                    });
                    //@ts-ignore
                } else if (newValue && newValue.inputValue) {
                    setValue({
                        //@ts-ignore
                        label: newValue.inputValue,
                    });
                } else {
                    //@ts-ignore
                    setValue(newValue);

                    // send changes upstream
                    onChange(
                        event,
                        newValue &&
                            Array.isArray(newValue) &&
                            //@ts-ignore
                            newValue.map((v) => v.inputValue || v.label)
                    );
                }
            }}
            filterOptions={(options, params) => {
                const filtered = filter(options, params);

                const { inputValue } = params;
                const isExisting = options.some(
                    (option) => inputValue === option.label
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
                    placeholder="Choisissez ou ajoutez vos compétences"
                />
            )}
        />
    );
};
