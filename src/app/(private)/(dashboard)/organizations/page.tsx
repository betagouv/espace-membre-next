import { Metadata } from "next";

import { routeTitles } from "@/utils/routes/routeTitles";

import { OrganizationList } from "@/components/organization/OrganizationListPage";
import { getAllOrganizationsOptions } from "@/lib/kysely/queries/organizations";

export const metadata: Metadata = {
    title: `${routeTitles.organizationList()} / Espace Membre`,
};

export default async function Page() {
    const organizationOptions = await getAllOrganizationsOptions();
    return (
        <>
            <h1>{routeTitles.organizationList()}</h1>
            <OrganizationList organizationOptions={organizationOptions} />;
        </>
    );
}
