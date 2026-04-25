"use client";
import React from "react";

import Button from "@codegouvfr/react-dsfr/Button";
import Link from "next/link";
import { useRouter } from "next/navigation";

import SESponsorSelect from "@/components/SESponsorSelect";
import { Option } from "@/models/misc";

export interface OrganizationListProps {
  organizationOptions: Option[];
}

/* Pure component */
export const OrganizationList = (props: OrganizationListProps) => {
  const [organization, setOrganization] = React.useState("");
  const router = useRouter();
  const save = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    router.push(`/organizations/${organization}`);
  };
  return (
    <>
      <form onSubmit={save} className="fr-mb-2w">
        <SESponsorSelect
          isMulti={false}
          label="Organisations sponsors"
          placeholder="Sélectionne une organisation sponsor"
          allSponsors={props.organizationOptions}
          value={organization}
          onChange={(organization) => {
            setOrganization(organization ?? "");
          }}
        />
        <Button
          children="Voir cette organisation"
          nativeButtonProps={{
            type: "submit",
            disabled: !organization,
          }}
        />
      </form>

      <p>
        <Link
          className="fr-btn fr-btn--secondary"
          href="/organizations/create-form"
        >
          Créer une nouvelle fiche organisation sponsor
        </Link>
      </p>
    </>
  );
};
