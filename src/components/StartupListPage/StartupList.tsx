"use client";
import React from "react";

import Button from "@codegouvfr/react-dsfr/Button";
import { useRouter } from "next/navigation";

import SESelect, { StartupType } from "@/components/SESelect";
export interface StartupListProps {
  startups: StartupType[];
}

/* Pure component */
export const StartupList = (props: StartupListProps) => {
  const [startup, setStartup] = React.useState("");
  const router = useRouter();
  const save = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    router.push(`/startups/${startup}`);
  };
  return (
    <>
      <form onSubmit={save} className="fr-mb-2w">
        <SESelect
          startups={props.startups}
          onChange={(e: { value: React.SetStateAction<string> }) => {
            setStartup(e.value);
          }}
          isMulti={false}
          placeholder={"Sélectionne un produit"}
        />
        <Button
          children="Voir ce produit"
          nativeButtonProps={{
            type: "submit",
            disabled: !startup,
          }}
        />
      </form>

      <p>
        <a className="fr-btn fr-btn--secondary" href="/startups/create-form">
          Créer une nouvelle fiche produit
        </a>
      </p>
    </>
  );
};
