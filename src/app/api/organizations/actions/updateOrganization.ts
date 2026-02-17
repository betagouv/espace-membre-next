"use server";

import _ from "lodash";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";

import { addEvent } from "@/lib/events";
import { db } from "@/lib/kysely";
import { EventCode } from "@/models/actionEvent/actionEvent";
import { organizationUpdateSchema, organizationUpdateSchemaType } from "@/models/actions/organization";
import { authOptions } from "@/utils/authoptions";
import { AuthorizationError, NoDataError, UnwrapPromise, withErrorHandling } from "@/utils/error";

export async function updateOrganization({
  organization,
  organizationUuid,
}: {
  organization: organizationUpdateSchemaType;
  organizationUuid: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.id) {
    throw new AuthorizationError();
  }
  organizationUpdateSchema.parse(organization);
  const previousOrganizationData = await db
    .selectFrom("organizations")
    .selectAll()
    .where("uuid", "=", organizationUuid)
    .executeTakeFirst();
  if (!previousOrganizationData) {
    throw new NoDataError("Cannot find organization");
  }

  await db.transaction().execute(async (trx) => {
    // update organization data
    const res = await trx
      .updateTable("organizations")
      .set({
        name: organization.name,
        acronym: organization.acronym,
        ghid: organization.acronym.toLowerCase(),
        domaine_ministeriel: organization.domaine_ministeriel,
        type: organization.type,
      })
      .where("uuid", "=", organizationUuid)
      .returningAll()
      .executeTakeFirstOrThrow();

    revalidatePath("/organizations");

    await addEvent({
      action_code: EventCode.ORGANIZATION_UPDATED,
      created_by_username: session.user.id,
      action_metadata: {
        value: {
          ...res,
        },
        old_value: {
          ...previousOrganizationData,
        },
      },
    });
  });
}

export const safeUpdateOrganization = withErrorHandling<
  UnwrapPromise<ReturnType<typeof updateOrganization>>,
  Parameters<typeof updateOrganization>
>(updateOrganization);
