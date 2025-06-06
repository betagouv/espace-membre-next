import React from "react";

import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

import { Teams } from "@/@types/db";
import { Option } from "@/models/misc";

export default function TeamSelect({
  teamOptions,
  onChange,
  label,
  placeholder,
  hint,
  state,
  isMulti,
  stateRelatedMessage,
  defaultValue,
}: {
  teamOptions: Option[];
  onChange: any;
  isMulti?: boolean;
  label?: any;
  placeholder?: string;
  hint?: any;
  state?: any;
  stateRelatedMessage?: any;
  defaultValue?: any;
}) {
  return (
    <div className="fr-select-group">
      {!!label && (
        <label className="fr-label" htmlFor="team-select">
          {label || "Sélectionne une ou plusieurs équipes d'incubateur"}
          {!!hint && <span className="fr-hint-text">{hint}</span>}
        </label>
      )}
      <Autocomplete
        id="team-select"
        multiple={isMulti}
        options={teamOptions}
        onChange={onChange}
        defaultValue={defaultValue || undefined}
        isOptionEqualToValue={(option, value) => {
          return option.value === value.value;
        }}
        getOptionKey={(option) => option.value}
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
            placeholder={
              placeholder || "Sélectionne un ou plusieurs incubateurs"
            }
          />
        )}
      />
      {!!state && !!stateRelatedMessage && (
        <p className="fr-error-text">{stateRelatedMessage}</p>
      )}
    </div>
  );
}
