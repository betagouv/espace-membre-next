import React from "react";

import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

import { Option } from "@/models/misc";
import { sponsorSchemaType } from "@/models/sponsor";

type OnChangeType<T> = T extends true
    ? (value: string[] | null) => void
    : (value: string | null) => void;

type SESponsorSelectProps<T extends boolean> = {
    isMulti: T;
    defaultValue?: T extends true ? string[] | undefined : string | undefined;
    allSponsors: Option[];
    label?: string;
    hint?: string;
    state?: string;
    placeholder?: string;
    onChange: OnChangeType<T>;
    stateMessageRelated?: string;
    containerStyle?: React.CSSProperties;
};

export default function SESponsorSelect<T extends boolean>({
    defaultValue,
    allSponsors,
    label,
    hint,
    state,
    onChange,
    placeholder,
    stateMessageRelated,
    containerStyle,
    isMulti,
}: SESponsorSelectProps<true> | SESponsorSelectProps<false>) {
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
                multiple={isMulti}
                style={{
                    marginTop: "0.5rem",
                }}
                getOptionKey={(option) => "value"}
                options={allOptions}
                onChange={(e, newValue) => {
                    if (!newValue) {
                        onChange(newValue);
                    } else if (isMulti === true) {
                        onChange(
                            (
                                newValue as unknown as {
                                    value: string;
                                    label: string;
                                }[]
                            ).map((v) => v.value)
                        );
                    } else if (isMulti === false && !Array.isArray(newValue)) {
                        if (!newValue) {
                            onChange(newValue);
                        } else {
                            onChange(newValue.value);
                        }
                    }
                }}
                // getOptionLabel={(option) => option.label}
                defaultValue={
                    isMulti && defaultValue && defaultValue.length
                        ? allOptions.filter((se) =>
                              defaultValue.includes(se.value)
                          )
                        : defaultValue
                        ? allOptions.find((se) => se.value === defaultValue)
                        : undefined
                }
                // isOptionEqualToValue={(option, value) =>
                //     option.value === value.value
                // }
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
