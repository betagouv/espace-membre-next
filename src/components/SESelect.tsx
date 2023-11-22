"use client";
import React from "react";
import { Select } from "@codegouvfr/react-dsfr/Select";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

import { ClientOnly } from "./ClientOnly";

export default function SESelect({
    startups,
    onChange,
    isMulti,
    placeholder,
    defaultValue,
    hint,
    label,
    state,
    stateMessageRelated,
}: {
    startups: { value: string; label: string }[];
    onChange?: any;
    isMulti?: boolean;
    placeholder?: string;
    defaultValue?:
        | { value: string; label: string }
        | { value: string; label: string }[];
    hint?: string;
    label?: string;
    state?: "default" | "success" | "error" | undefined;
    stateMessageRelated?: string;
}) {
    const [value, setValue] = React.useState("");

    if (!isMulti) {
        return (
            <Select
                label={label || "De quel produit voulez-vous voir les infos ?"}
                hint={hint}
                nativeSelectProps={{
                    onChange: (event) => {
                        setValue(event.target.value);
                        onChange({ value: event.target.value });
                    },
                    value,
                }}
            >
                <option value="" disabled hidden>
                    {placeholder || "Selectionnez un produit"}
                </option>
                {startups.map((startup, index) => (
                    <option value={startup.value} key={index}>
                        {startup.label}
                    </option>
                ))}
            </Select>
        );
    }
    const onTagsChange = (event, values) => {
        onChange(values);
    };

    return (
        <div className="fr-select-group">
            <label className="fr-label">
                {label}
                {!!hint && <span className="fr-hint-text">{hint}</span>}
            </label>
            <Autocomplete
                multiple
                options={startups.map((se) => ({
                    id: se.value,
                    label: se.label,
                }))}
                onChange={onTagsChange}
                defaultValue={
                    defaultValue
                        ? (
                              defaultValue as { value: string; label: string }[]
                          ).map((se) => ({
                              id: se.value,
                              label: se.label,
                          }))
                        : undefined
                }
                isOptionEqualToValue={(option, value) => option.id === value.id}
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
                // sx={{ width: "500px" }}
            />
            {!!state && !!stateMessageRelated && (
                <p className="fr-error-text">{stateMessageRelated}</p>
            )}
        </div>
    );
}
