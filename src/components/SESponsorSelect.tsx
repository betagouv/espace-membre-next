import React from "react";
import axios from "axios";
import { Autocomplete, TextField } from "@mui/material";
import { Sponsor } from "@/models/sponsor";
import { computeRoute } from "@/routes/routes";

interface SESponsorSelectProps {
    value: string[];
    newSponsors: Sponsor[];
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
    newSponsors,
    label,
    hint,
    state,
    onChange,
    placeholder,
    stateMessageRelated,
    containerStyle,
}: SESponsorSelectProps) {
    const [options, setOptions] = React.useState<
        { value: string; label: string }[]
    >([]);

    React.useEffect(() => {
        // React advises to declare the async function directly inside useEffect
        const getOptions = async () => {
            const sponsors = await axios
                .get<any[]>("/api/sponsors")
                .then((response) => response.data)
                .catch((err) => {
                    throw new Error(`Error to get incubators infos : ${err}`);
                });
            const optionValues = Object.keys(sponsors).map((sponsor) => {
                return {
                    value: sponsor,
                    label: sponsors[sponsor].name,
                };
            });
            setOptions(optionValues);
        };

        // You need to restrict it at some point
        // This is just dummy code and should be replaced by actual
        if (!options.length) {
            getOptions();
        }
    }, []);

    if (!options.length) {
        return null;
    }

    const newSponsorsOptions = newSponsors.map((newSponsor) => ({
        value: newSponsor.acronym,
        label: newSponsor.name,
    }));

    const allOptions = [...options, ...newSponsorsOptions];
    return (
        <div className="fr-select-group" style={containerStyle}>
            <label className="fr-label">
                {label || `Sponsor`}
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
