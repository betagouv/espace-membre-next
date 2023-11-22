import React from "react";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

import { ClientOnly } from "./ClientOnly";

const statusOptions = [
    { value: "active", label: "Membres Actifs" },
    { value: "unactive", label: "Alumnis" },
    { value: "both", label: "Membres actifs et Alumnis" },
];

export default function MemberStatusSelect({
    onChange,
    label,
    hint,
    state,
    stateRelatedMessage,
    defaultValue,
}: {
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
                    {label}
                    {!!hint && <span className="fr-hint-text">{hint}</span>}
                </label>
            )}
            <Autocomplete
                multiple
                options={statusOptions.map((se) => ({
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
                filterSelectedOptions={true}
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
                        placeholder="Sélectionne les membres actifs ou inactifs"
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
