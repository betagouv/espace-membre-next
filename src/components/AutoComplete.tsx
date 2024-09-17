import React, { useCallback, useState } from "react";

import {
    AutocompleteValue as MuiAutocompleteValue,
    createFilterOptions,
} from "@mui/material/Autocomplete";
import { fr } from "@node_modules/@codegouvfr/react-dsfr";
import { UseAutocompleteProps } from "@node_modules/@mui/base";
import { InternalStandardProps as StandardProps } from "@node_modules/@mui/material";
import MuiAutocomplete, {
    AutocompleteRenderInputParams,
} from "@node_modules/@mui/material/Autocomplete";
import { ChipProps, ChipTypeMap } from "@node_modules/@mui/material/Chip";
import TextField from "@node_modules/@mui/material/TextField";

type AutoCompleteValue<
    Value,
    Multiple extends boolean | undefined,
    DisableClearable extends boolean | undefined,
    FreeSolo extends boolean | undefined,
> = MuiAutocompleteValue<Value, Multiple, DisableClearable, FreeSolo>;

type AutoCompleteSelect<
    Value,
    Multiple extends boolean | undefined,
    DisableClearable extends boolean | undefined,
> = Multiple extends true
    ? Array<Value>
    : DisableClearable extends true
      ? NonNullable<Value>
      : Value | null;

export type OptionType<Group extends boolean | undefined> = {
    inputValue?: string;
    label: string;
    group?: Group extends true ? string : never;
};

interface AutoCompleteProps<
    Value,
    Multiple extends boolean | undefined,
    DisableClearable extends boolean | undefined,
    FreeSolo extends boolean | undefined,
    GroupOptions extends boolean | undefined,
    ChipComponent extends React.ElementType = ChipTypeMap["defaultComponent"],
> extends UseAutocompleteProps<Value, Multiple, DisableClearable, FreeSolo>,
        StandardProps<
            React.HTMLAttributes<HTMLDivElement>,
            "defaultValue" | "onChange" | "onSelect" | "children"
        > {
    ChipProps?: ChipProps<ChipComponent>;
    defaultValue: AutoCompleteValue<
        Value,
        Multiple,
        DisableClearable,
        FreeSolo
    >;
    multiple?: Multiple;
    freeSolo?: FreeSolo;
    options: readonly Value[];
    groupOptions?: GroupOptions;
    onChange?: (
        event: React.SyntheticEvent,
        value: AutoCompleteValue<Value, Multiple, DisableClearable, FreeSolo>,
    ) => void;
    onSelect: (
        value: AutoCompleteSelect<Value, Multiple, DisableClearable>,
        event: React.SyntheticEvent,
    ) => void;
    placeholder?: string;
    optionKeyField?: string;
    optionLabelField?: string;
    renderInput?: (params: AutocompleteRenderInputParams) => React.ReactNode;
}

export default function AutoComplete<
    Value,
    Multiple extends boolean | undefined,
    FreeSolo extends boolean | undefined,
    DisableClearable extends boolean | undefined,
    GroupOptions extends boolean | undefined,
>({
    onChange,
    onSelect,
    freeSolo,
    multiple,
    options,
    groupOptions,
    placeholder,
    optionKeyField = "label",
    optionLabelField = "label",
    defaultValue,
    renderInput,
    ...props
}: AutoCompleteProps<
    Value,
    Multiple,
    DisableClearable,
    FreeSolo,
    GroupOptions
>) {
    const [value, setValue] = useState<
        AutoCompleteValue<Value, Multiple, DisableClearable, FreeSolo>
    >(() => {
        if (defaultValue) {
            return defaultValue;
        }

        return (multiple ? [] : null) as AutoCompleteValue<
            Value,
            Multiple,
            DisableClearable,
            FreeSolo
        >;
    });
    const filter = createFilterOptions<Value>();

    const defaultRenderInput = useCallback(
        (params: AutocompleteRenderInputParams) => (
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
        ),
        [placeholder],
    );

    return (
        <MuiAutocomplete
            filterSelectedOptions
            {...(groupOptions
                ? { groupBy: (option: any) => option.group || "Autres" }
                : {})}
            loadingText={"Chargement..."}
            noOptionsText={"Pas de résultat"}
            {...props}
            freeSolo={freeSolo}
            value={value}
            multiple={multiple}
            options={options}
            selectOnFocus={true}
            clearOnBlur={true}
            isOptionEqualToValue={(option, value) =>
                option[optionKeyField] === value[optionKeyField]
            }
            renderGroup={(params) => (
                <li key={params.key}>
                    <div
                        className={fr.cx("fr-p-1w", "fr-text--heavy")}
                        style={{
                            backgroundColor:
                                fr.colors.options.blueEcume._850_200.default,
                        }}
                    >
                        {params.group}
                    </div>
                    <ul>{params.children}</ul>
                </li>
            )}
            onChange={(event, values) => {
                let newValues: AutoCompleteValue<
                    Value,
                    Multiple,
                    DisableClearable,
                    FreeSolo
                >;

                if (typeof values === "string") {
                    return;
                } else if (Array.isArray(values)) {
                    newValues = values.map((v) => {
                        if (v.inputValue) {
                            const { inputValue, ...rest } = v;

                            return {
                                ...rest,
                                [optionLabelField]: inputValue,
                                [optionKeyField]: inputValue,
                            };
                        }

                        return v;
                    }) as AutoCompleteValue<
                        Value,
                        Multiple,
                        DisableClearable,
                        FreeSolo
                    >;
                } else {
                    newValues = values;
                }

                setValue(newValues);
                if (onSelect) {
                    onSelect(
                        newValues as AutoCompleteSelect<
                            Value,
                            Multiple,
                            DisableClearable
                        >,
                        event,
                    );
                } else {
                    onChange && onChange(event, newValues);
                }
            }}
            getOptionKey={(option) => option[optionKeyField]}
            getOptionLabel={(option) => option[optionLabelField]}
            filterOptions={(options, params) => {
                const filtered = filter(options, params);

                if (!freeSolo) {
                    return filtered;
                }

                const { inputValue } = params;
                const isExisting = options.some(
                    (option) =>
                        inputValue.toLowerCase() ===
                        option[optionLabelField].toLowerCase(),
                );
                if (inputValue !== "" && !isExisting) {
                    filtered.push({
                        inputValue,
                        label: `Ajouter "${inputValue}"`,
                    } as Value);
                }

                return filtered;
            }}
            renderInput={renderInput ?? defaultRenderInput}
        />
    );
}
