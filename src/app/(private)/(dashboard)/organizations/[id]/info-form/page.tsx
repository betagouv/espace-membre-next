import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { BreadCrumbFiller } from "@/app/BreadCrumbProvider";
import { OrganizationUpdate } from "@/components/organization/OrganizationUpdatePage";
import { db } from "@/lib/kysely";
import { getOrganization } from "@/lib/kysely/queries/organizations";
import { organizationToModel } from "@/models/mapper";
import { authOptions } from "@/utils/authoptions";
import { routeTitles } from "@/utils/routes/routeTitles";

type Props = {
    params: { id: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    // read route params
    const id = params.id;
    const organization = await getOrganization(id);

    return {
        title: `${routeTitles.organizationDetailsEdit(
            organization?.name,
        )} / Espace Membre`,
    };
}

export default async function Page(props: Props) {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/login");
    }
    const uuid = props.params.id;
    const dbOrganization = await db
        .selectFrom("organizations")
        .selectAll()
        .where("uuid", "=", uuid)
        .executeTakeFirst();
    if (!dbOrganization) {
        redirect("/organizations");
    }

    const organization = organizationToModel(dbOrganization);
    const componentProps = {
        organization,
    };
    return (
        <>
            <BreadCrumbFiller
                currentPage={organization.name}
                currentItemId={organization.uuid}
            />
            <OrganizationUpdate {...componentProps} />
        </>
    );
}
