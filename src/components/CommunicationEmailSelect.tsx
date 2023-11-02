// import React from "react"
// import Select from 'react-select'

// import { ClientOnly } from "./ClientOnly"

// export default({ defaultValue, onChange, email, value } : { defaultValue?: string, onChange: any, email: string, value }) => {
//     const options = [{
//         value: 'secondary',
//         label: `mon adresse pro ${email ? `: ${email}` : ''}`
//     },
//     {
//         value: 'primary',
//         label: 'mon adresse @beta.gouv.fr'
//     }]

//     return <ClientOnly><Select
//         options={options}
//         defaultValue={options.find(opt => opt.value === 'secondary')}
//         value={options.find(opt => opt.value === value)}
//         onChange={onChange}
//         name={'communication_email'}
//      /></ClientOnly>
//   }
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
export default function CommunicationEmailSelect({
    onChange,
    email,
    placeholder,
    hint,
    label,
    defaultValue,
}: {
    defaultValue: any;
    onChange: any;
    name?: string;
    placeholder?: string;
    hint?: string;
    label?: string;
    email: string;
}) {
    const [value, setValue] = useState(defaultValue);

    const options = [
        {
            value: "secondary",
            label: `mon adresse pro ${email ? `: ${email}` : ""}`,
        },
        {
            value: "primary",
            label: "mon adresse @beta.gouv.fr",
        },
    ];

    return (
        <Select
            label={label}
            hint={hint}
            nativeSelectProps={{
                onChange: (event) => {
                    setValue(event.target.value);
                    onChange({ value: event.target.value });
                },
                value,
                defaultValue,
            }}
        >
            <option value="" disabled hidden>
                {placeholder}
            </option>
            {options.map((opt, index) => (
                <option key={index} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </Select>
    );
}
