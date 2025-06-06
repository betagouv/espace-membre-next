"use client";

import React from "react";

import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import slugify from "@sindresorhus/slugify";

import SponsorDomainSelect from "./SponsorDomainSelect";
import SponsorTypeSelect from "./SponsorTypeSelect";
import {
  Sponsor,
  SponsorDomaineMinisteriel,
  SponsorType,
} from "@/models/sponsor";

// import style manually

interface SponsorForm {
  addSponsor: (sponsor: Sponsor) => void;
}

/* Pure component */
export const SponsorForm = (props: SponsorForm) => {
  const [acronym, setAcronym] = React.useState("");
  const [name, setName] = React.useState("");
  const [type, setType] = React.useState("");
  const [domaine, setDomaine] = React.useState("");

  const save = async (
    e: React.MouseEvent<HTMLButtonElement>,
  ): Promise<void> => {
    e.preventDefault();
    props.addSponsor({
      ghid: slugify(name),
      name,
      domaine_ministeriel: domaine as SponsorDomaineMinisteriel,
      type: type as SponsorType,
      acronym,
    });
  };

  function hasChanged() {
    return name && domaine && type && acronym;
  }
  let disabled = false;

  if (!hasChanged()) {
    disabled = true;
  }
  return (
    <>
      <div>
        <Alert
          description="Attention ceci ajoutera un nouveau sponsor. Vérifie bien que le sponsor n'existe pas déjà."
          severity="info"
          small
        />
        {
          <>
            <div>
              <Input
                label={"Nom du sponsor"}
                nativeInputProps={{
                  onChange: (e) => {
                    setName(e.currentTarget.value);
                  },
                  value: name,
                }}
              />
              <Input
                label={"Acronym du sponsor"}
                nativeInputProps={{
                  onChange: (e) => {
                    setAcronym(e.currentTarget.value);
                  },
                  value: acronym,
                }}
              />
              <SponsorTypeSelect
                isMulti={false}
                onChange={(value) => {
                  setType(value.value);
                }}
                value={type}
              />
              <SponsorDomainSelect
                isMulti={false}
                onChange={(value) => {
                  setDomaine(value.value);
                }}
                value={domaine}
              />
              <Button
                children={"Enregistrer"}
                nativeButtonProps={{
                  onClick: save,
                  disabled: disabled,
                }}
              />
            </div>
          </>
        }
      </div>
    </>
  );
};

export default SponsorForm;
