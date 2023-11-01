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
    incubators?: any;
    onChange?: any;
    label?: any;
    hint?: any;
    state?: any;
    stateRelatedMessage?: any;
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
                multiple
                options={incubators.map((se) => ({
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
                        placeholder="Sélectionne un ou plusieurs incubateurs"
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
