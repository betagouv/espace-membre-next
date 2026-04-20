"use client";
import React from "react";

import { fr } from "@codegouvfr/react-dsfr";

import { OrganizationForm } from "../OrganizationForm/OrganizationForm";
import { safeUpdateOrganization } from "@/app/api/organizations/actions/updateOrganization";
import { organizationUpdateSchemaType } from "@/models/actions/organization";
import { sponsorSchemaType } from "@/models/sponsor";
import { routeTitles } from "@/utils/routes/routeTitles";

interface OrganizationUpdateProps {
  organization: sponsorSchemaType;
}

/* Pure component */
export const OrganizationUpdate = (props: OrganizationUpdateProps) => {
  const css = ".panel { overflow: hidden; width: auto; min-height: 100vh; }";

  const save = async (data: organizationUpdateSchemaType) => {
    const result = await safeUpdateOrganization({
      organization: data,
      organizationUuid: props.organization.uuid,
    });
    window.scrollTo({ top: 20, behavior: "smooth" });
    return result;
  };

  return (
    <>
      <div className={fr.cx("fr-mb-5w")}>
        <h1>{routeTitles.organizationDetailsEdit(props.organization.name)}</h1>

        <div className="beta-banner"></div>

        {(props.organization && (
          <OrganizationForm save={save} organization={props.organization} />
        )) || <>Loading...</>}
      </div>
      <style media="screen">{css}</style>
    </>
  );
};
