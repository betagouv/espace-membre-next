import { Metadata } from "next";

import { OrganizationList } from "@/components/organization/OrganizationListPage";
import { getAllOrganizationsOptions } from "@/lib/kysely/queries/organizations";
import { routeTitles } from "@/utils/routes/routeTitles";

export const metadata: Metadata = {
  title: `${routeTitles.organizationList()} / Espace Membre`,
};

export default async function Page() {
  const organizationOptions = await getAllOrganizationsOptions();
  return (
    <>
      <h1>{routeTitles.organizationList()}</h1>
      <p>
        Une organisation sponsor dans le cadre du programme beta.gouv.fr est une
        entité publique qui soutient le développement d'un produit ou service
        numérique innovant. Cette organisation identifie un problème ou un
        besoin spécifique dans ses opérations ou pour ses usagers, et elle
        collabore avec une équipe de beta.gouv.fr pour créer une solution
        numérique adaptée.
      </p>
      <OrganizationList organizationOptions={organizationOptions} />
    </>
  );
}
