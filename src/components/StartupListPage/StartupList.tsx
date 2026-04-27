"use client";
import React from "react";

import Button from "@codegouvfr/react-dsfr/Button";
import Link from "next/link";
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
            if (e && e.value) setStartup(e.value);
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
        <Link className="fr-btn fr-btn--secondary" href="/startups/create-form">
          Créer une nouvelle fiche produit
        </Link>
      </p>
    </>
  );
};
