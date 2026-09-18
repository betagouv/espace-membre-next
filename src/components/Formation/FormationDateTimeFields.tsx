"use client";

import React from "react";

import { fr } from "@codegouvfr/react-dsfr";
import Input from "@codegouvfr/react-dsfr/Input";

/**
 * Le jour et l'heure d'une formation, en deux champs distincts.
 *
 * Le schéma et l'action serveur continuent d'attendre une seule chaîne au
 * format `datetime-local` (« YYYY-MM-DDTHH:mm ») : ce composant se contente de
 * la découper à l'affichage et de la recomposer à la saisie. Un champ
 * `datetime-local` unique mélange deux rôles dans un seul libellé et se pilote
 * mal au clavier ; deux champs annoncent chacun ce qu'ils attendent.
 */

const splitDateTime = (value: string | undefined) => {
  const [date = "", heure = ""] = (value ?? "").split("T");
  // L'heure peut arriver avec les secondes selon le navigateur d'origine.
  return { date, heure: heure.slice(0, 5) };
};

// Une moitié seule ne fait pas une date : on renvoie une valeur vide, que le
// schéma refuse, plutôt qu'un horaire à moitié inventé.
const joinDateTime = (date: string, heure: string) =>
  date && heure ? `${date}T${heure}` : "";

export const FormationDateTimeFields = ({
  value,
  onChange,
  onBlur,
  error,
  dateLabel = "Date",
  heureLabel = "Heure de début",
  className,
}: {
  value?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  dateLabel?: string;
  heureLabel?: string;
  className?: string;
}) => {
  const initial = splitDateTime(value);
  const [date, setDate] = React.useState(initial.date);
  const [heure, setHeure] = React.useState(initial.heure);

  // Tant qu'une moitié manque, la valeur remontée est vide et le schéma se
  // plaint de la date : le message serait affiché sous le mauvais champ. On
  // désigne donc nous-mêmes la moitié qui manque.
  const dateError = error && !date ? "La date est requise" : undefined;
  const heureError = error && !heure ? "L'heure est requise" : undefined;
  const otherError = error && date && heure ? error : undefined;

  return (
    <>
      <div className={fr.cx("fr-col-12", "fr-col-md-4")}>
        <Input
          className={className}
          label={dateLabel}
          state={dateError || otherError ? "error" : "default"}
          stateRelatedMessage={dateError || otherError}
          nativeInputProps={{
            type: "date",
            value: date,
            onChange: (event) => {
              setDate(event.target.value);
              onChange(joinDateTime(event.target.value, heure));
            },
            onBlur,
          }}
        />
      </div>
      <div className={fr.cx("fr-col-6", "fr-col-md-3")}>
        <Input
          className={className}
          label={heureLabel}
          state={heureError ? "error" : "default"}
          stateRelatedMessage={heureError}
          nativeInputProps={{
            type: "time",
            value: heure,
            onChange: (event) => {
              setHeure(event.target.value);
              onChange(joinDateTime(date, event.target.value));
            },
            onBlur,
          }}
        />
      </div>
    </>
  );
};
