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
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

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
    multiple,
}: {
    members: { value: string; label: string }[];
    defaultValue:
        | { value: string; label: string }
        | { value: string; label: string }[]
        | undefined;
    onChange: (obj: { value: string } | { value: string }[]) => void;
    name?: string;
    placeholder?: string;
    hint?: string;
    label?: string;
    required?: boolean;
    state?: "success" | "default" | "error" | undefined;
    stateRelatedMessage?: string;
    multiple?: boolean;
}) {
    const [value, setValue] = useState("");

    //     return (
    //         <Select
    //             label={label || "Nom ou prénom du membre"}
    //             hint={hint}
    //             nativeSelectProps={{
    //                 onChange: (event) => {
    //                     setValue(event.target.value);
    //                     onChange({ value: event.target.value });
    //                 },
    //                 value,
    //                 required,
    //             }}
    //             state={state}
    //             stateRelatedMessage={stateRelatedMessage}
    //         >
    //             <option value="" disabled hidden>
    //                 {placeholder || "Selectionnez un membre"}
    //             </option>
    //             {members.map((member, index) => (
    //                 <option value={member.value} key={index}>
    //                     {member.label}
    //                 </option>
    //             ))}
    //         </Select>
    //     );
    // }

    const onTagsChange = (event, data) => {
        onChange(
            !!multiple
                ? data.map((user) => ({ value: user.id, label: user.label }))
                : { value: data.id, label: data.label }
        );
    };

    return (
        <div className="fr-select-group">
            <label className="fr-label">
                {label}
                {!!hint && <span className="fr-hint-text">{hint}</span>}
            </label>
            <Autocomplete
                multiple={!!multiple}
                options={members.map((se) => ({
                    id: se.value,
                    label: se.label,
                }))}
                onChange={onTagsChange}
                defaultValue={
                    defaultValue
                        ? (
                              defaultValue as { value: string; label: string }[]
                          ).map((se) => ({
                              id: se.value,
                              label: se.label,
                          }))
                        : undefined
                }
                isOptionEqualToValue={(option, value) => option.id === value.id}
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
                        placeholder={placeholder}
                    />
                )}
                // sx={{ width: "500px" }}
            />
            {!!state && !!stateRelatedMessage && (
                <p className="fr-error-text">{stateRelatedMessage}</p>
            )}
        </div>
    );
}
