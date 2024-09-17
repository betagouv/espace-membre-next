import React, { useCallback } from "react";

import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

import AutoComplete, { OptionType } from "@/components/AutoComplete";
import { Option } from "@/models/misc";
import { sponsorSchemaType } from "@/models/sponsor";

type OnChangeType<T> = T extends true
    ? (value: string[] | null) => void
    : (value: string | null) => void;

type SESponsorSelectProps<T extends boolean> = {
    isMulti: T;
    defaultValue?: T extends true ? string[] | undefined : string | undefined;
    allSponsors: Option[];
    value?: T extends true ? string[] | undefined : string | undefined;
    label?: string;
    hint?: string;
    state?: string;
    placeholder?: string;
    onChange: OnChangeType<T>;
    stateMessageRelated?: string;
    containerStyle?: React.CSSProperties;
};

type SponsorOption = OptionType<false> & {
    value: string;
};

export default function SESponsorSelect<T extends boolean>({
    defaultValue,
    allSponsors,
    label,
    hint,
    state,
    onChange,
    value,
    placeholder,
    stateMessageRelated,
    containerStyle,
    isMulti,
}: SESponsorSelectProps<true> | SESponsorSelectProps<false>) {
    const allOptions = Object.entries(allSponsors).map(
        ([key, sponsor], index) =>
            ({
                value: sponsor.value,
                label: sponsor.label,
            }) as SponsorOption,
    );

    const localOnChange = useCallback(
        (newValues: any) => {
            if (newValues === null) {
                onChange(null);

                return;
            }

            if (isMulti && Array.isArray(newValues)) {
                onChange(newValues);

                return;
            }

            if (!isMulti && "string" === typeof newValues) {
                onChange(newValues);
            }
        },
        [isMulti, onChange],
    );

    const autoCompleteProps = {
        style: {
            marginTop: "0.5rem",
        },
        placeholder,
        options: allOptions,
        onSelect: localOnChange,
    };

    return (
        <div className="fr-select-group" style={containerStyle}>
            <label className="fr-label">
                {label || `Sponsors`}
                {!!hint && <span className="fr-hint-text">{hint}</span>}
            </label>
            {isMulti ? (
                <AutoComplete
                    {...autoCompleteProps}
                    multiple
                    freeSolo={false}
                    defaultValue={
                        value ? value.map((label) => ({ label })) : []
                    }
                />
            ) : (
                <AutoComplete
                    {...autoCompleteProps}
                    multiple={false}
                    freeSolo={false}
                    defaultValue={value ? { label: value } : ""}
                />
            )}

            {!!state && !!stateMessageRelated && (
                <p className="fr-error-text">{stateMessageRelated}</p>
            )}
        </div>
    );
}
