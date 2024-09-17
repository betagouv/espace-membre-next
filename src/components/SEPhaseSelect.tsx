import React, { useState } from "react";

import Select from "@codegouvfr/react-dsfr/Select";
import AutoComplete, { OptionType } from "@/components/AutoComplete";

type PhaseType = OptionType<false> & {
    value: string;
}

const options: PhaseType[] = [
    { value: "acceleration", label: "En Accélération" },
    { value: "success", label: "Pérennisé (success)" },
    { value: "transfer", label: "Transféré" },
    { value: "investigation", label: "En Investigation" },
    { value: "construction", label: "En Construction" },
    { value: "alumni", label: "Partenariat terminé (alumni)" },
];

export default function SEPhaseSelect({
    onChange,
    isMulti,
    placeholder,
    label,
    hint,
    state,
    stateRelatedMessage,
    defaultValue,
}: {
    startups?: any;
    onChange?: any;
    isMulti?: any;
    label?: string;
    hint?: string;
    state?: string;
    stateRelatedMessage?: string;
    placeholder?: any;
    defaultValue?: string | { value: string; label: string }[];
}) {
    const [value, setValue] = useState(defaultValue);

    if (!isMulti) {
        return (
            <Select
                nativeSelectProps={{
                    onChange: (event) => {
                        setValue(event.target.value);
                        onChange({ value: event.target.value });
                    },
                    value: value as string,
                    defaultValue: value as string,
                }}
                label={undefined}
            >
                <option value="" disabled hidden>
                    {placeholder || "Selectionnez une phase"}
                </option>
                {options.map((option, index) => (
                    <option key={index} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </Select>
        );
    }

    return (
        <div className="fr-select-group">
            {!!label && (
                <label className="fr-label">
                    {label}
                    {!!hint && <span className="fr-hint-text">{hint}</span>}
                </label>
            )}
            <AutoComplete
                optionKeyField={"value"}
                multiple
                options={options}
                onSelect={onChange}
                defaultValue={defaultValue as PhaseType[]}
            />
            {!!state && !!stateRelatedMessage && (
                <p className="fr-error-text">{stateRelatedMessage}</p>
            )}
        </div>
    );
}
