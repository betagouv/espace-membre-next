import React from "react";

import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

import { Sponsor } from "@/models/sponsor";

interface SESponsorSelectProps {
    value: string[];
    allSponsors: Sponsor[];
    label?: string;
    hint?: string;
    state?: string;
    placeholder?: string;
    onChange: (e: string | string[]) => void;
    stateMessageRelated?: string;
    containerStyle?: React.CSSProperties;
}

export default function SESponsorSelect({
    value,
    allSponsors,
    label,
    hint,
    state,
    onChange,
    placeholder,
    stateMessageRelated,
    containerStyle,
}: SESponsorSelectProps) {
    const allOptions = Object.entries(allSponsors).map(
        ([key, sponsor], index) => ({
            value: key,
            label: sponsor.name,
        })
    );

    return (
        <div className="fr-select-group" style={containerStyle}>
            <label className="fr-label">
                {label || `Sponsors`}
                {!!hint && <span className="fr-hint-text">{hint}</span>}
            </label>
            <Autocomplete
                multiple
                style={{
                    marginTop: "0.5rem",
                }}
                options={allOptions}
                onChange={(event, newValue) => {
                    onChange(newValue.map((v) => v.value));
                }}
                getOptionLabel={(option) => option.label}
                value={
                    value && value.length
                        ? allOptions.filter((se) => value.includes(se.value))
                        : undefined
                }
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
                        placeholder={placeholder || "Sponsor"}
                    />
                )}
            />
            {!!state && !!stateMessageRelated && (
                <p className="fr-error-text">{stateMessageRelated}</p>
            )}
        </div>
    );
}
