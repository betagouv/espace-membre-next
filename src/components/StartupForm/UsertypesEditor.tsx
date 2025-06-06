"use client";
import React from "react";

import AutoComplete, { OptionType } from "@/components/AutoComplete";
import { usertypes } from "@/models/usertypes";

type UsertypeType = OptionType<false>;

const thematiquesMap: readonly UsertypeType[] = usertypes.map(
  (thematique) =>
    ({
      label: thematique,
    }) as UsertypeType,
);

//  from https://mui.com/material-ui/react-autocomplete/#creatable
export const UsertypesEditor = ({
  onChange,
  defaultValue,
}: {
  onChange: (event: any, thematiques: string[]) => void;
  defaultValue: string[];
}) => {
  return (
    <AutoComplete
      id="usertypes-editor"
      defaultValue={defaultValue.map((label) => ({ label }))}
      multiple
      freeSolo
      placeholder="Précise les types d'usagers du produits"
      options={thematiquesMap}
      onSelect={(values, event) => {
        onChange(
          event,
          values.map((v) => v.label),
        );
      }}
    />
  );
};
