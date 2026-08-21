"use client";

import Select from "@codegouvfr/react-dsfr/Select";

import { ApiPerimeter } from "@/models/api/perimeter";

export type PerimeterOption = { uuid: string; label: string };

/**
 * Le formulaire choisit dans une liste et n'envoie que des uuid : les
 * perimetres stockes sont insensibles a un renommage de ghid.
 */
export const PerimeterSelect = ({
  label,
  hint,
  value,
  incubators,
  startups,
  allowNone,
  allowGlobal,
  onChange,
}: {
  label: string;
  hint?: string;
  value: ApiPerimeter | null;
  incubators: PerimeterOption[];
  startups: PerimeterOption[];
  allowNone?: boolean;
  allowGlobal?: boolean;
  onChange: (perimeter: ApiPerimeter | null) => void;
}) => {
  const serialize = (p: ApiPerimeter | null) =>
    !p ? "" : p.kind === "global" ? "global" : `${p.kind}:${p.uuid}`;

  const parse = (raw: string): ApiPerimeter | null => {
    if (!raw) return null;
    if (raw === "global") return { kind: "global" };
    const [kind, uuid] = raw.split(":");
    return kind === "incubator"
      ? { kind: "incubator", uuid }
      : { kind: "startup", uuid };
  };

  return (
    <Select
      label={label}
      hint={hint}
      nativeSelectProps={{
        value: serialize(value),
        onChange: (e) => onChange(parse(e.target.value)),
      }}
    >
      {allowNone && <option value="">Aucun (clef sans écriture)</option>}
      {allowGlobal && <option value="global">Global</option>}
      {incubators.map((incubator) => (
        <option key={incubator.uuid} value={`incubator:${incubator.uuid}`}>
          Incubateur : {incubator.label}
        </option>
      ))}
      {startups.map((startup) => (
        <option key={startup.uuid} value={`startup:${startup.uuid}`}>
          Produit : {startup.label}
        </option>
      ))}
    </Select>
  );
};
