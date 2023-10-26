import React from "react";
import ReactSelect from "react-select";
import { useState } from "react";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { ClientOnly } from "../ClientOnly";
import { SponsorType } from "@/models/sponsor";

const options = Object.values(SponsorType).map((type) => ({
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
                isMulti={isMulti}
                defaultValue={
                    isMulti
                        ? options.filter((opt) => opt.value === defaultValue)
                        : options.filter((opt) => opt.value === defaultValue)[0]
                }
                onChange={(e) => onChange(e["value"])}
                placeholder={placeholder || "Sélectionne un type"}
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
            label="Sélectionnez un type de sponsor"
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
