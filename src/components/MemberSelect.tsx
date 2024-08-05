import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

import { memberPublicInfoSchemaType } from "@/models/member";

type MemberSelectProps<T extends boolean> = {
    onChange: T extends true
        ? (value: string[]) => void
        : (value: string) => void;
    isMulti?: T;
    members: memberPublicInfoSchemaType[];
    defaultValue: T extends true
        ? { value: string; label: string }[] | undefined
        : { value: string; label: string } | undefined;
    name?: string;
    placeholder?: string;
    hint?: string;
    label?: string;
    required?: boolean;
    valueKey?: string;
    state?: "success" | "default" | "error" | undefined;
    stateRelatedMessage?: string;
    multiple?: boolean;
};

export default function MemberSelect<T extends boolean>({
    members,
    defaultValue,
    onChange,
    name,
    placeholder,
    hint,
    label,
    required,
    valueKey,
    state,
    stateRelatedMessage,
    multiple,
}: MemberSelectProps<T>) {
    const onTagsChange = (event, data) => {
        onChange(
            !!multiple
                ? data.map((user) => ({ value: user.id, label: user.label }))
                : { value: data.id, label: data.label }
        );
    };
    let defaultMemberValue;
    if (!!multiple && defaultValue) {
        defaultMemberValue = (
            defaultValue as { value: string; label: string }[]
        ).map((se) => ({
            id: se.value,
            label: se.label,
        }));
    } else if (!multiple && defaultValue) {
        let singleDefaultValue = defaultValue as {
            value: string;
            label: string;
        };
        defaultMemberValue = {
            id: singleDefaultValue.value,
            label: singleDefaultValue.label,
        };
    }
    const uniqueIds = new Set();

    const memberOptions = members
        .map((member) => ({
            id: member[valueKey || "username"],
            label: member.fullname || member.username,
        }))
        .filter((memberOption) => {
            if (uniqueIds.has(memberOption.id)) {
                return false;
            } else {
                uniqueIds.add(memberOption.id);
                return true;
            }
        })
        .sort((a, b) => {
            if (a.label < b.label) {
                return -1;
            }
            if (a.label > b.label) {
                return 1;
            }
            return 0;
        });
    return (
        <div className="fr-select-group">
            <label className="fr-label">
                {label}
                {!!hint && <span className="fr-hint-text">{hint}</span>}
            </label>
            <Autocomplete
                multiple={!!multiple}
                options={memberOptions}
                onChange={onTagsChange}
                defaultValue={defaultMemberValue}
                getOptionKey={(option) => option.id}
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
