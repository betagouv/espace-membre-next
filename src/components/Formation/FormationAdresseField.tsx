"use client";

import React from "react";

import Input from "@codegouvfr/react-dsfr/Input";
import Autocomplete from "@mui/material/Autocomplete";

/**
 * Service de géocodage de la Géoplateforme de l'IGN, qui sert la Base adresse
 * nationale. `api-adresse.data.gouv.fr` en est l'ancienne adresse : dépréciée
 * depuis le 31 janvier 2026, elle renvoie vers celle-ci.
 */
const GEOCODAGE_URL = "https://data.geopf.fr/geocodage/search";

// En dessous de trois caractères, le service renvoie des adresses au hasard ;
// au-delà de 200, il refuse la requête.
const MIN_CARACTERES = 3;
const MAX_CARACTERES = 200;
// Le temps de finir un mot avant d'interroger le service.
const DELAI_MS = 250;

type ReponseGeocodage = {
  features?: { properties?: { label?: string } }[];
};

/**
 * Adresse d'une formation en présentiel, avec suggestions.
 *
 * Les suggestions ne sont qu'une aide : le champ reste libre, pour préciser un
 * bâtiment ou une salle après l'adresse, ou saisir un lieu que la base ne
 * connaît pas. Une panne du service ne fait que les faire disparaître.
 */
export const FormationAdresseField = ({
  value,
  onChange,
  onBlur,
  error,
  className,
}: {
  value?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  className?: string;
}) => {
  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  const [chargement, setChargement] = React.useState(false);

  React.useEffect(() => {
    const recherche = (value ?? "").trim();
    if (
      recherche.length < MIN_CARACTERES ||
      recherche.length > MAX_CARACTERES
    ) {
      setSuggestions([]);
      return;
    }

    // Chaque frappe annule la recherche précédente : sans cela, une réponse
    // lente pourrait arriver après la suivante et afficher des suggestions
    // pour un texte qui n'est plus celui du champ.
    const controleur = new AbortController();
    const minuteur = setTimeout(async () => {
      setChargement(true);
      try {
        const reponse = await fetch(
          `${GEOCODAGE_URL}?${new URLSearchParams({
            q: recherche,
            index: "address",
            limit: "5",
          })}`,
          { signal: controleur.signal },
        );
        if (!reponse.ok) throw new Error(`Géocodage : ${reponse.status}`);
        const json: ReponseGeocodage = await reponse.json();
        setSuggestions(
          (json.features ?? [])
            .map((feature) => feature.properties?.label)
            .filter((label): label is string => !!label),
        );
      } catch {
        if (!controleur.signal.aborted) setSuggestions([]);
      } finally {
        if (!controleur.signal.aborted) setChargement(false);
      }
    }, DELAI_MS);

    return () => {
      clearTimeout(minuteur);
      controleur.abort();
    };
  }, [value]);

  return (
    <Autocomplete
      freeSolo
      options={suggestions}
      // Le service a déjà choisi et classé : un filtre local sur le texte
      // saisi écarterait la suggestion qui corrige une faute de frappe.
      filterOptions={(options) => options}
      inputValue={value ?? ""}
      onInputChange={(_event, nouvelleValeur) => onChange(nouvelleValeur)}
      loading={chargement}
      loadingText="Recherche en cours…"
      renderInput={(params) => (
        <Input
          // L'ancrage de la liste de suggestions, que MUI place sous le champ.
          ref={params.InputProps.ref}
          className={className}
          label="Adresse de la formation"
          hintText="Choisis dans la liste, puis ajoute la salle."
          state={error ? "error" : "default"}
          stateRelatedMessage={error}
          nativeInputProps={{
            // Rôle, état et identifiant du champ viennent de MUI : le libellé
            // DSFR reprend cet identifiant, et le lecteur d'écran annonce la
            // liste de suggestions.
            ...params.inputProps,
            onBlur: (event) => {
              params.inputProps.onBlur?.(event);
              onBlur?.();
            },
          }}
        />
      )}
    />
  );
};
