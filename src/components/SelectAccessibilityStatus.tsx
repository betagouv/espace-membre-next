import React from "react";

import Select from "@codegouvfr/react-dsfr/Select";

const options = [
  { value: "non conforme", label: "non conforme" },
  { value: "partiellement conforme", label: "partiellement conforme" },
  { value: "totalement conforme", label: "totalement conforme" },
];
export default function SelectAccebilityStatus({ value, onChange }) {
  return (
    <Select
      label="Conformité en accessibilité du produit"
      hint="Non conforme, si le site n'a pas encore été audité"
      nativeSelectProps={{
        onChange,
        required: true,
        defaultValue: value,
      }}
    >
      <option value="" disabled hidden>
        Selectionnez une option
      </option>
      {options.map((option) => {
        return (
          <option key={option.value} value={option.value}>
            {option.value}
          </option>
        );
      })}
    </Select>
  );
}
