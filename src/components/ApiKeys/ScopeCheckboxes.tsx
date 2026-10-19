"use client";

import Checkbox from "@codegouvfr/react-dsfr/Checkbox";

import { API_SCOPES, ApiScope } from "@/models/api/scope";

const LABELS: Record<ApiScope, string> = {
  "members:read": "Lire les membres",
  "startups:read": "Lire les produits",
  "incubators:read": "Lire les incubateurs",
  "startups:write": "Écrire sur les produits",
  "incubators:write": "Écrire sur les incubateurs",
};

/**
 * Aucune implication entre portées : cocher une écriture ne coche pas la
 * lecture correspondante, et l'API répondra 204 sans corps si la lecture manque.
 */
export const ScopeCheckboxes = ({
  value,
  onChange,
  allowStartupWrite = true,
  allowIncubatorWrite = true,
}: {
  value: ApiScope[];
  onChange: (scopes: ApiScope[]) => void;
  // Deux drapeaux et non un seul : les deux portees d'ecriture n'ont pas les
  // memes perimetres recevables. Un perimetre de nature produit ouvre
  // startups:write mais jamais incubators:write, que canWriteIncubator refuse
  // par construction. Un drapeau unique offrait la case incubateur des qu'un
  // seul produit etait ecrivable, et livrait une portee morte.
  allowStartupWrite?: boolean;
  allowIncubatorWrite?: boolean;
}) => (
  <Checkbox
    legend="Portées"
    hintText="Une portée d'écriture ne donne jamais la lecture correspondante."
    options={API_SCOPES.filter((scope) =>
      scope === "startups:write"
        ? allowStartupWrite
        : scope === "incubators:write"
          ? allowIncubatorWrite
          : true,
    ).map((scope) => ({
      label: LABELS[scope],
      nativeInputProps: {
        checked: value.includes(scope),
        onChange: (e: { target: { checked: boolean } }) =>
          onChange(
            e.target.checked
              ? [...value, scope]
              : value.filter((s) => s !== scope),
          ),
      },
    }))}
  />
);
