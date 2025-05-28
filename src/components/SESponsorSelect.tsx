import React, { useCallback } from "react";

import AutoComplete, { OptionType } from "@/components/AutoComplete";
import { Option } from "@/models/misc";

type OnChangeType<T> = T extends true
  ? (value: string[] | null) => void
  : (value: string | null) => void;

type SESponsorSelectProps<T extends boolean> = {
  isMulti: T;
  defaultValue?: T extends true ? string[] | undefined : string | undefined;
  allSponsors: Option[];
  value?: T extends true ? string[] | undefined : string | undefined;
  label?: string;
  hint?: string;
  state?: string;
  placeholder?: string;
  onChange: OnChangeType<T>;
  stateMessageRelated?: string;
  containerStyle?: React.CSSProperties;
};

type SponsorOption = OptionType<false> & {
  value: string;
};

export default function SESponsorSelect<T extends boolean>({
  defaultValue,
  allSponsors,
  label,
  hint,
  state,
  onChange,
  value,
  placeholder,
  stateMessageRelated,
  containerStyle,
  isMulti,
}: SESponsorSelectProps<true> | SESponsorSelectProps<false>) {
  const allOptions = Object.entries(allSponsors).map(
    ([key, sponsor], index) =>
      ({
        value: sponsor.value,
        label: sponsor.label,
      }) as SponsorOption,
  );

  const localOnChange = useCallback(
    (newValues: any) => {
      if (newValues === null) {
        onChange(null);

        return;
      }

      if (isMulti && Array.isArray(newValues)) {
        onChange(newValues.map((v) => v.value));

        return;
      }

      if (!isMulti) {
        onChange(newValues.value ?? null);
      }
    },
    [isMulti, onChange],
  );

  const convertToAutoCompleteValue = function <
    Multiple extends boolean,
    R = Multiple extends true ? Option[] : Option | null,
  >(
    value: string[] | string | undefined,
    options: Option[],
    isMulti: Multiple,
  ): R {
    if (isMulti) {
      return (
        Array.isArray(value)
          ? value
              .map((v) => options.find((o) => o.value === v))
              .filter((v) => !!v)
          : []
      ) as R;
    }

    return (value ? options.find((o) => o.value === value) : null) as R;
  };

  const autoCompleteProps = {
    style: {
      marginTop: "0.5rem",
    },
    placeholder,
    options: allOptions,
    onSelect: localOnChange,
    optionKeyField: "value",
  };

  return (
    <div className="fr-select-group" style={containerStyle}>
      <label className="fr-label" htmlFor="se-sponsor-select">
        {label || `Sponsors`}
        {!!hint && <span className="fr-hint-text">{hint}</span>}
      </label>
      {isMulti ? (
        <AutoComplete
          id="se-sponsor-select"
          {...autoCompleteProps}
          multiple
          value={convertToAutoCompleteValue(value, allOptions, true)}
          defaultValue={convertToAutoCompleteValue(
            defaultValue,
            allOptions,
            true,
          )}
          freeSolo={false}
        />
      ) : (
        <AutoComplete
          id="se-sponsor-select"
          {...autoCompleteProps}
          multiple={false}
          freeSolo={false}
          value={convertToAutoCompleteValue(value, allOptions, false)}
          defaultValue={convertToAutoCompleteValue(
            defaultValue,
            allOptions,
            false,
          )}
        />
      )}

      {!!state && !!stateMessageRelated && (
        <p className="fr-error-text">{stateMessageRelated}</p>
      )}
    </div>
  );
}
