"use client";
import React from "react";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

import { ClientOnly } from "./ClientOnly";

export default function SESelect({
    startups,
    onChange,
    onBlur,
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
    onBlur?: any;
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
                multiple={isMulti}
                options={startups}
                onChange={onTagsChange}
                onBlur={onBlur}
                defaultValue={
                    defaultValue
                        ? (defaultValue as { value: string; label: string }[])
                        : undefined
                }
                getOptionLabel={(opt) => opt.label}
                isOptionEqualToValue={(option, value) =>
                    option.value === value.value
                }
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
