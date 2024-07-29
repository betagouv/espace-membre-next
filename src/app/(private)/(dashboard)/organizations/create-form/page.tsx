import { Metadata } from "next";

import { OrganizationCreate } from "@/components/organization/OrganizationCreatePage";
import { db } from "@/lib/kysely";
import { organizationToModel } from "@/models/mapper";
import { routeTitles } from "@/utils/routes/routeTitles";

export const metadata: Metadata = {
    title: `${routeTitles.organizationCreate()} / Espace Membre`,
};

export default async function Page(props) {
    return (
        <>
            <h1>{routeTitles.organizationCreate()}</h1>
            <OrganizationCreate />
        </>
    );
}
