"use client";

import React from "react";

import { OrganizationForm } from "../OrganizationForm/OrganizationForm";
import { safeCreateOrganization } from "@/app/api/organizations/actions/createOrganization";

interface organizationInfoCreateProps {}

/* Pure component */
export const OrganizationCreate = (props: organizationInfoCreateProps) => {
  const save = async (data) => {
    const result = await safeCreateOrganization({
      organization: data,
    });
    window.scrollTo({ top: 20, behavior: "smooth" });
    return result;
  };
  return (
    <>
      <div className="beta-banner"></div>
      <div>
        <OrganizationForm save={save} />
        <br />
        <br />
      </div>
    </>
  );
};
