"use server";

import _ from "lodash";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { db } from "@/lib/kysely";
import {
    organizationUpdateSchemaType,
    organizationUpdateSchema,
} from "@/models/actions/organization";
import { authOptions } from "@/utils/authoptions";

export async function createOrganization({
    organization,
}: {
    organization: organizationUpdateSchemaType;
}) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.id) {
        throw new Error(`You don't have the right to access this function`);
    }
    organizationUpdateSchema.parse(organization);
    await db.transaction().execute(async (trx) => {
        // update organization data
        const res = await trx
            .insertInto("organizations")
            .values({
                name: organization.name,
                acronym: organization.acronym,
                ghid: organization.acronym.toLowerCase(),
                domaine_ministeriel: organization.domaine_ministeriel,
                type: organization.type,
            })
            .returning("uuid")
            .executeTakeFirst();

        if (!res) {
            throw new Error("Organization data could not be inserted into db");
        }

        revalidatePath("/organizations");
    });
}
