import React from "react";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

export default function SEIncubateurSelect({
    incubators,
    onChange,
    label,
    hint,
    state,
    stateRelatedMessage,
    defaultValue,
}: {
    incubators: { value: string; label: string }[];
    onChange: any;
    label?: any;
    hint?: any;
    state?: any;
    stateRelatedMessage?: any;
    defaultValue?: any;
}) {
    const incubatorOptions = incubators.map((se) => ({
        id: se.value,
        label: se.label,
    }));
    return (
        <div className="fr-select-group">
            {!!label && (
                <label className="fr-label">
                    {label || "Sélectionne un ou plusieurs incubateurs"}
                    {!!hint && <span className="fr-hint-text">{hint}</span>}
                </label>
            )}
            <Autocomplete
                multiple
                options={incubatorOptions}
                onChange={onChange}
                defaultValue={
                    defaultValue
                        ? defaultValue.map((se) => ({
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
                        placeholder="Sélectionne un ou plusieurs incubateurs"
                    />
                )}
            />
            {!!state && !!stateRelatedMessage && (
                <p className="fr-error-text">{stateRelatedMessage}</p>
            )}
        </div>
    );
}
