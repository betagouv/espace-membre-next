import React from "react";

import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

import { ClientOnly } from "./ClientOnly";
import AutoComplete from "@/components/AutoComplete";

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
            <AutoComplete
                multiple
                options={statusOptions.map((se) => ({
                    id: se.value,
                    label: se.label,
                }))}
                onSelect={(values, event) => onChange(event, values)}
                defaultValue={defaultValue}
            />
            {!!state && !!stateRelatedMessage && (
                <p className="fr-error-text">{stateRelatedMessage}</p>
            )}
        </div>
    );
}
