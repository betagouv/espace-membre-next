// import React from "react"
// import Select from 'react-select'

// import { ClientOnly } from "./ClientOnly"

// export default({
//     members,
//     defaultValue,
//     onChange,
//     name,
//     placeholder } : {
//         members: any,
//         defaultValue: any,
//         onChange: any,
//         name?: string,
//         placeholder?: string
//     }) => {
//     return <ClientOnly><Select
//         options={members}
//         defaultValue={defaultValue}
//         onChange={onChange}
//         name={name}
//         placeholder={placeholder || 'Sélectionne un référent'}  /></ClientOnly>
//   }
import { useState } from "react";
import { Select } from "@codegouvfr/react-dsfr/Select";

export default function MemberSelect({
    members,
    defaultValue,
    onChange,
    name,
    placeholder,
    hint,
    label,
    required,
    state,
    stateRelatedMessage,
}: {
    members: { value: string; label: string }[];
    defaultValue: any;
    onChange: any;
    name?: string;
    placeholder?: string;
    hint?: string;
    label?: string;
    required?: boolean;
    state?: "success" | "default" | "error" | undefined;
    stateRelatedMessage?: string;
}) {
    const [value, setValue] = useState("");

    return (
        <Select
            label={label || "Nom ou prénom du membre"}
            hint={hint}
            nativeSelectProps={{
                onChange: (event) => {
                    setValue(event.target.value);
                    onChange({ value: event.target.value });
                },
                value,
                required,
            }}
            state={state}
            stateRelatedMessage={stateRelatedMessage}
        >
            <option value="" disabled hidden>
                {placeholder || "Selectionnez un membre"}
            </option>
            {members.map((member) => (
                <option value={member.value}>{member.label}</option>
            ))}
        </Select>
    );
}
