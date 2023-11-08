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
    onChange: any;
    stateMessageRelated?: string;
}

export default function SESponsorSelect({
    value,
    newSponsors,
    label,
    hint,
    state,
    onChange,
    stateMessageRelated,
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
        <div className="fr-select-group">
            <label className="fr-label">
                {label}
                {!!hint && <span className="fr-hint-text">{hint}</span>}
            </label>
            <Autocomplete
                multiple
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
                renderInput={(params) => (
                    <TextField {...params} placeholder="Sponsor" />
                )}
            />
            {!!state && !!stateMessageRelated && (
                <p className="fr-error-text">{stateMessageRelated}</p>
            )}
        </div>
    );
}
