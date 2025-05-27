import React from "react";

import Select from "@codegouvfr/react-dsfr/Select";

import { genderOptions } from "@/models/member";

// Define the props for the parent component
interface GenderSelectProps {
  state: "success" | "error" | "default" | undefined;
  stateRelatedMessage?: string;
  label?: string;
  hint?: string;
  nativeSelectProps: React.DetailedHTMLProps<
    React.SelectHTMLAttributes<HTMLSelectElement>,
    HTMLSelectElement
  >;
}

const GenderSelect: React.FC<GenderSelectProps> = (props) => {
  const { label, state, hint, stateRelatedMessage, nativeSelectProps } = props;

  return (
    <Select
      label={label || "Genre :"}
      hint={hint}
      nativeSelectProps={nativeSelectProps}
      state={state}
      stateRelatedMessage={stateRelatedMessage}
    >
      {genderOptions.map((gender) => (
        <option key={gender.key} value={gender.key}>
          {gender.name}
        </option>
      ))}
    </Select>
  );
};

export default GenderSelect;
