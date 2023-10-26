import React from "react";
import ReactSelect from "react-select";
import { useState } from "react";
import { ClientOnly } from "../ClientOnly";
import { SponsorDomaineMinisteriel } from "@/models/sponsor";
import { Select } from "@codegouvfr/react-dsfr/Select";

const options = Object.values(SponsorDomaineMinisteriel).map((type) => ({
    value: type,
    label: type,
}));

export default ({
    onChange,
    isMulti,
    placeholder,
    defaultValue,
}: {
    value?: any;
    onChange?: any;
    isMulti?: boolean;
    placeholder?: any;
    defaultValue?: string;
}) => {
    if (!isMulti) {
        return (
            <SingleSelect
                onChange={onChange}
                placeholder={placeholder}
                defaultValue={defaultValue}
            ></SingleSelect>
        );
    }
    return (
        <ClientOnly>
            <ReactSelect
                options={options}
                isMulti={false}
                defaultValue={
                    isMulti
                        ? options.filter((opt) => opt.value === defaultValue)
                        : options.filter((opt) => opt.value === defaultValue)[0]
                }
                onChange={(e) => onChange(e["value"])}
                placeholder={
                    placeholder || "Sélectionne un domaine ministériel"
                }
            />
        </ClientOnly>
    );
};

function SingleSelect({
    defaultValue,
    onChange,
    placeholder,
}: {
    defaultValue: any;
    onChange: any;
    placeholder?: string;
}) {
    const [value, setValue] = useState(defaultValue);

    return (
        <Select
            label="Sélectionnez un domaine ministériel"
            nativeSelectProps={{
                onChange: (event) => {
                    setValue(event.target.value);
                    onChange({ value: event.target.value });
                },
                value,
            }}
        >
            <option value="" disabled hidden>
                {placeholder}
            </option>
            {options.map((option) => (
                <option value={option.value}>{option.label}</option>
            ))}
        </Select>
    );
}
