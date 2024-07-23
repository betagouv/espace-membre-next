"use server";

import _ from "lodash";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";

import { db } from "@/lib/kysely";
import { organizationUpdateSchemaType } from "@/models/actions/organization";
import { authOptions } from "@/utils/authoptions";

export async function updateOrganization({
    organization,
    organizationUuid,
}: {
    organization: organizationUpdateSchemaType;
    organizationUuid: string;
}) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.id) {
        throw new Error(`You don't have the right to access this function`);
    }
    const previousOrganizationData = await db
        .selectFrom("organizations")
        .selectAll()
        .where("uuid", "=", organizationUuid)
        .executeTakeFirst();
    if (!previousOrganizationData) {
        throw new Error("Cannot find organization");
    }

    await db.transaction().execute(async (trx) => {
        // update organization data
        await trx
            .updateTable("organizations")
            .set({
                name: organization.name,
                acronym: organization.acronym,
                ghid: organization.acronym.toLowerCase(),
                domaine_ministeriel: organization.domaine_ministeriel,
                type: organization.type,
            })
            .where("uuid", "=", organizationUuid)
            .execute();

        revalidatePath("/organizations");
    });
}
