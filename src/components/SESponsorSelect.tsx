import React from "react";
import axios from "axios";
import { Autocomplete, TextField } from "@mui/material";
import { Sponsor } from "@/models/sponsor";

interface SESponsorSelectProps {
    value: {
        value: string;
        label: string;
    }[];
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
    // return <ClientOnly>
    //     <Select
    //         isMulti
    //         defaultValue={allOptions.filter(opt => value.includes(opt.value))}
    //         // value={options.filter(opt => value.includes(opt.value))}
    //         value={allOptions.filter(opt => value.includes(opt.value))}
    //         onChange={(opts) => onChange(opts.map(opt => opt.value))}
    //         options={allOptions}
    //         placeholder={'Sélectionne un ou plusieurs sponsors'}
    //         hideSelectedOptions={false}
    //         blurInputOnSelect={false}
    //       />
    //   </ClientOnly>
    return (
        <div className="fr-select-group">
            <label className="fr-label">
                {label}
                {!!hint && <span className="fr-hint-text">{hint}</span>}
            </label>
            <Autocomplete
                multiple
                options={allOptions.map((se) => ({
                    id: se.value,
                    label: se.label,
                }))}
                onInputChange={(...[, newValue]) => {
                    onChange(newValue);
                }}
                defaultValue={
                    value
                        ? value.map((se) => ({
                              id: se.value,
                              label: se.label,
                          }))
                        : undefined
                }
                renderInput={(params) => (
                    <TextField
                        {...params}
                        // label="limitTags"
                        placeholder="Produit"
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
