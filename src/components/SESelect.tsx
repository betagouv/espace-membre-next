"use client";
import React, { useState } from "react";

import AutoComplete, { OptionType } from "@/components/AutoComplete";

export type StartupType = OptionType<false> & {
  value: string;
};

export default function SESelect({
  startups,
  onChange,
  onBlur,
  isMulti,
  placeholder,
  defaultValue,
  hint,
  label,
  state,
  stateMessageRelated,
}: {
  startups: StartupType[];
  onChange?: any;
  onBlur?: any;
  isMulti?: boolean;
  placeholder?: string;
  defaultValue?:
    | { value: string; label: string }
    | { value: string; label: string }[];
  hint?: string;
  label?: string;
  state?: "default" | "success" | "error" | undefined;
  stateMessageRelated?: string;
}) {
  const onTagsChange = (values) => {
    onChange(values);
  };
  const [initialValue] = useState(
    defaultValue ? (defaultValue as StartupType[]) : undefined,
  );

  return (
    <div className="fr-select-group">
      <label className="fr-label" htmlFor="se-select">
        {label}
        {!!hint && <span className="fr-hint-text">{hint}</span>}
      </label>
      <AutoComplete
        id="se-select"
        placeholder={placeholder}
        multiple={isMulti}
        options={startups}
        onSelect={onTagsChange}
        onBlur={onBlur}
        defaultValue={initialValue}
        // sx={{ width: "500px" }}
      />
      {!!state && !!stateMessageRelated && (
        <p className="fr-error-text">{stateMessageRelated}</p>
      )}
    </div>
  );
}
