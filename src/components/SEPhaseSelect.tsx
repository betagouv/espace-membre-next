import React, { useState } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { ClientOnly } from "./ClientOnly";
import Select from "@codegouvfr/react-dsfr/Select";

const options = [
    { value: "acceleration", label: "En Accélération" },
    { value: "success", label: "Pérennisé (success)" },
    { value: "transfer", label: "Transféré" },
    { value: "investigation", label: "En Investigation" },
    { value: "construction", label: "En Construction" },
    { value: "alumni", label: "Partenariat terminé (alumni)" },
];

export default function SEPhaseSelect({
    onChange,
    isMulti,
    placeholder,
    label,
    hint,
    state,
    stateRelatedMessage,
    defaultValue,
}: {
    startups?: any;
    onChange?: any;
    isMulti?: any;
    label?: string;
    hint?: string;
    state?: string;
    stateRelatedMessage?: string;
    placeholder?: any;
    defaultValue?: string | { value: string; label: string }[];
}) {
    const [value, setValue] = useState(defaultValue);

    if (!isMulti) {
        return (
            <Select
                nativeSelectProps={{
                    onChange: (event) => {
                        setValue(event.target.value);
                        onChange({ value: event.target.value });
                    },
                    value: value as string,
                    defaultValue: value as string,
                }}
                label={undefined}
            >
                <option value="" disabled hidden>
                    {placeholder || "Selectionnez une phase"}
                </option>
                {options.map((option, index) => (
                    <option key={index} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </Select>
        );
    }

    return (
        <div className="fr-select-group">
            {!!label && (
                <label className="fr-label">
                    {label}
                    {!!hint && <span className="fr-hint-text">{hint}</span>}
                </label>
            )}
            <Autocomplete
                multiple
                options={options.map((se) => ({
                    id: se.value,
                    label: se.label,
                }))}
                onChange={onChange}
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
                        placeholder="Sélectionne une ou plusieurs phases"
                    />
                )}
                // sx={{ width: "500px" }}
            />
            {!!state && !!stateRelatedMessage && (
                <p className="fr-error-text">{stateRelatedMessage}</p>
            )}
        </div>
    );
}
