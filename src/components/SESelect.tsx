"use client";
import React from "react";
import ReactSelect from "react-select";
import { Select } from "@codegouvfr/react-dsfr/Select";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

import { ClientOnly } from "./ClientOnly";

export default ({
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
    defaultValue?: { value: string; label: string }[];
    hint?: string;
    label?: string;
    state?: "default" | "success" | "error" | undefined;
    stateMessageRelated?: string;
}) => {
    if (!isMulti) {
        const [value, setValue] = React.useState("");
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
                {startups.map((startup) => (
                    <option value={startup.value}>{startup.label}</option>
                ))}
            </Select>
        );
    }
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
                onChange={onChange}
                defaultValue={
                    defaultValue
                        ? defaultValue.map((se) => ({
                              id: se.value,
                              label: se.label,
                          }))
                        : undefined
                }
                renderInput={(params) => (
                    <TextField
                        {...params}
                        // label="limitTags"
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
};
