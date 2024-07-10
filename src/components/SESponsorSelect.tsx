import React from "react";

import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

import { Option } from "@/models/misc";
import { sponsorSchemaType } from "@/models/sponsor";

type SESponsorSelectProps<T extends boolean> = {
    isMulti?: T;
    value: T extends true ? string[] | undefined : string | undefined;
    allSponsors: Option[];
    label?: string;
    hint?: string;
    state?: string;
    placeholder?: string;
    onChange: T extends true
        ? (value: string[]) => void
        : (value: string) => void;
    stateMessageRelated?: string;
    containerStyle?: React.CSSProperties;
};

export default function SESponsorSelect<T extends boolean>({
    value,
    allSponsors,
    label,
    hint,
    state,
    onChange,
    placeholder,
    stateMessageRelated,
    containerStyle,
    isMulti,
}: SESponsorSelectProps<T>) {
    const allOptions = Object.entries(allSponsors).map(
        ([key, sponsor], index) => ({
            value: sponsor.value,
            label: sponsor.label,
        })
    );
    return (
        <div className="fr-select-group" style={containerStyle}>
            <label className="fr-label">
                {label || `Sponsors`}
                {!!hint && <span className="fr-hint-text">{hint}</span>}
            </label>
            <Autocomplete
                multiple={isMulti === undefined ? true : isMulti}
                style={{
                    marginTop: "0.5rem",
                }}
                options={allOptions}
                onChange={(event, newValue) => {
                    if (isMulti) {
                        onChange(newValue.map((v) => v.value));
                    } else {
                        onChange(newValue.value);
                    }
                }}
                getOptionLabel={(option) => option.label}
                value={
                    isMulti && value && value.length
                        ? allOptions.filter((se) => value.includes(se.value))
                        : value
                        ? allOptions.find((se) => se.value === value)
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
