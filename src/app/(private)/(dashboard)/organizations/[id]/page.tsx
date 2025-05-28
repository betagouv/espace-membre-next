import { Metadata, ResolvingMetadata } from "next";
import { redirect } from "next/navigation";

import { BreadCrumbFiller } from "@/app/BreadCrumbProvider";
import OrganizationPage from "@/components/organization/OrganizationPage/Organization";
import {
  getOrganization,
  getOrganizationStartups,
  getOrganizationIncubators,
} from "@/lib/kysely/queries/organizations";
import { organizationToModel } from "@/models/mapper";

type Props = {
  params: { id: string };
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  // read route params
  const id = params.id;

  const organization = await getOrganization(id);
  return {
    title: organization ? `${organization.name} / Espace Membre` : "",
  };
}

export default async function Page({ params }: Props) {
  const dbOrganization = await getOrganization(params.id);
  if (!dbOrganization) {
    redirect("/organizations");
  }

  const organization = organizationToModel(dbOrganization);
  const startups = await getOrganizationStartups(organization.uuid);
  const incubators = await getOrganizationIncubators(organization.uuid);
  return (
    <>
      <BreadCrumbFiller
        currentPage={organization.name}
        currentItemId={organization.uuid}
      />
      <OrganizationPage
        organizationInfos={organization}
        startups={startups}
        incubators={incubators}
      />
    </>
  );
}
