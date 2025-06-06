"use client";
import React from "react";

import { fr } from "@codegouvfr/react-dsfr";
import Autocomplete, { createFilterOptions } from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

import { technos } from "@/models/technos";

interface TechnoType {
  inputValue?: string;
  label: string;
}
const technosMap: readonly TechnoType[] = technos.map((techno) => ({
  label: techno,
}));

const filter = createFilterOptions<TechnoType>();

// todo: should be merged with UsertypesEditor and others

//  from https://mui.com/material-ui/react-autocomplete/#creatable
export const TechnoEditor = ({
  onChange,
  defaultValue,
}: {
  onChange: (event: any, technos: string[]) => void;
  defaultValue: string[];
}) => {
  const [value, setValue] = React.useState<TechnoType[]>(
    defaultValue.map((t) => ({ label: t }) as TechnoType),
  );

  return (
    <Autocomplete
      value={value}
      freeSolo
      id="techo-editor"
      multiple={true}
      selectOnFocus={true}
      clearOnBlur={true}
      options={technosMap}
      //groupBy={(option) => option.group || "Autres"}
      renderGroup={(params) => (
        <li key={params.key}>
          <div
            className={fr.cx("fr-p-1w", "fr-text--heavy")}
            style={{
              backgroundColor: fr.colors.options.blueEcume._850_200.default,
            }}
          >
            {params.group}
          </div>
          <ul>{params.children}</ul>
        </li>
      )}
      onChange={(event, newValues) => {
        const newValue = newValues.length
          ? newValues[newValues.length - 1]
          : null;
        if (typeof newValue === "string") {
          // touche entrée
          const values = [...value, { label: newValue }];
          setValue(values);
          onChange(
            event,
            values.map((v) => v.inputValue || v.label),
          );
        } else if (newValue && newValue.inputValue) {
          // Create a new value from the user input
          const values = [...value, { label: newValue.inputValue }];
          setValue(values);
          onChange(
            event,
            values.map((v) => v.inputValue || v.label),
          );
        } else if (Array.isArray(newValues)) {
          const convertedValues: TechnoType[] = newValues.map((newValue) => {
            if (typeof newValue === "string") {
              // Convert string to TechnoType
              return { label: newValue };
            } else {
              // Already in the correct format
              return newValue;
            }
          });
          setValue(convertedValues);

          // Send changes upstream
          onChange(
            event,
            convertedValues.map((v) => v.inputValue || v.label),
          );
        }
      }}
      filterOptions={(options, params) => {
        const filtered = filter(options, params);

        const { inputValue } = params;
        const isExisting = options.some(
          (option) => inputValue === option.label,
        );
        if (inputValue !== "" && !isExisting) {
          filtered.push({
            inputValue,
            label: `Ajouter "${inputValue}"`, // doesnt work ;/
          });
        }

        return filtered;
      }}
      getOptionLabel={(option) => {
        if (typeof option === "string") {
          // touchée entrée
          return option;
        }
        if (option.inputValue) {
          return option.inputValue;
        }
        return option.label;
      }}
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
          placeholder="Choisissez ou ajoutez les technos utilisées par votre produit"
        />
      )}
    />
  );
};
