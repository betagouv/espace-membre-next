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

export default ({
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
    placeholder?: any;
    defaultValue?: string;
}) => {
    if (!isMulti) {
        const [value, setValue] = useState(defaultValue);

        return (
            <Select
                nativeSelectProps={{
                    onChange: (event) => {
                        setValue(event.target.value);
                        onChange({ value: event.target.value });
                    },
                    value,
                    defaultValue: value,
                }}
            >
                <option value="" disabled hidden>
                    {placeholder || "Selectionnez une phase"}
                </option>
                {options.map((option) => (
                    <option value={option.value}>{option.label}</option>
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
};
