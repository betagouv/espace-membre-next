import AutoComplete from "@/components/AutoComplete";
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
    const onTagsChange = (data) => {
        onChange(
            !!multiple
                ? data.map((user) => ({ value: user.id, label: user.label }))
                : { value: data.id, label: data.label },
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
            <label className="fr-label" htmlFor="member-select">
                {label}
                {!!hint && <span className="fr-hint-text">{hint}</span>}
            </label>
            <AutoComplete
                id="member-select"
                multiple={!!multiple}
                options={memberOptions}
                onSelect={onTagsChange}
                defaultValue={defaultMemberValue}
                optionKeyField={"id"}
                placeholder={placeholder}
            />
            {!!state && !!stateRelatedMessage && (
                <p className="fr-error-text">{stateRelatedMessage}</p>
            )}
        </div>
    );
}
