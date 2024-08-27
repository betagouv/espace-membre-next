import React from "react";

import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

import { Incubators } from "@/@types/db";
import { Option } from "@/models/misc";

export default function SEIncubateurSelect({
    incubatorOptions,
    onChange,
    label,
    placeholder,
    hint,
    state,
    isMulti,
    stateRelatedMessage,
    defaultValue,
}: {
    incubatorOptions: Option[];
    onChange: any;
    isMulti?: boolean;
    label?: string;
    placeholder?: string;
    hint?: string;
    state?: "error" | "success" | "warning";
    stateRelatedMessage?: string;
    defaultValue?: any;
}) {
    return (
        <div className="fr-select-group">
            {!!label && (
                <label className="fr-label">
                    {label || "Sélectionne un ou plusieurs incubateurs"}
                    {!!hint && <span className="fr-hint-text">{hint}</span>}
                </label>
            )}
            <Autocomplete
                multiple={isMulti}
                options={incubatorOptions}
                onChange={onChange}
                defaultValue={defaultValue}
                isOptionEqualToValue={(option, value) => {
                    return option.value === value.value;
                }}
                getOptionKey={(option) => option.value}
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
                        placeholder={
                            placeholder ||
                            "Sélectionne un ou plusieurs incubateurs"
                        }
                    />
                )}
            />
            {!!state && !!stateRelatedMessage && (
                <p className="fr-error-text">{stateRelatedMessage}</p>
            )}
        </div>
    );
}
