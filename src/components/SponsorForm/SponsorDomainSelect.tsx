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

export default function SponsorDomainSelect({
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
}) {
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
                onChange={(e) => {
                    if (e) {
                        onChange(e["value"]);
                    }
                }}
                placeholder={
                    placeholder || "Sélectionne un domaine ministériel"
                }
            />
        </ClientOnly>
    );
}

function SingleSelect({
    defaultValue,
    onChange,
    placeholder,
}: {
    defaultValue?: string;
    onChange: any;
    placeholder?: string;
}) {
    const [value, setValue] = useState(defaultValue || "");

    return (
        <Select
            label="Domaine ministériel"
            nativeSelectProps={{
                onChange: (event) => {
                    setValue(event.target.value);
                    onChange({ value: event.target.value });
                },
                value,
            }}
        >
            <option value="" disabled hidden>
                Sélectionne un domaine ministériel
            </option>
            {options.map((option, index) => (
                <option value={option.value} key={index}>
                    {option.label}
                </option>
            ))}
        </Select>
    );
}
