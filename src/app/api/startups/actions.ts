"use server";

import slugify from "@sindresorhus/slugify";
import { Transaction } from "kysely";
import _ from "lodash";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { DB } from "@/@types/db";
import { addEvent } from "@/lib/events";
import { db } from "@/lib/kysely";
import { getStartupIncubatorIds } from "@/lib/kysely/queries/incubators";
import { EventCode } from "@/models/actionEvent/actionEvent";
import {
  startupInfoUpdateSchema,
  startupInfoUpdateSchemaType,
} from "@/models/actions/startup";
import { startupEventToModel } from "@/models/mapper";
import { sponsorSchema } from "@/models/sponsor";
import { phaseSchema } from "@/models/startup";
import { authOptions } from "@/lib/authoptions";
import {
  AuthorizationError,
  NoDataError,
  StartupUniqueConstraintViolationError,
  UnwrapPromise,
  withErrorHandling,
} from "@/lib/error";
import { addMonths, differenceInDays } from "date-fns";
import { ca } from "date-fns/locale";
import { canEditStartup } from "@/lib/authorization/startup";
import { assertCanEditStartup } from "@/lib/authorization/startup";
import { toAuthSubject } from "@/lib/authorization/subject";

export async function getStartup({ uuid }: { uuid: string }) {
  return db
    .selectFrom("startups")
    .selectAll()
    .where("uuid", "=", uuid)
    .executeTakeFirstOrThrow();
}

/**
 * Replace the incubators linked to a startup in startups_incubators, which is
 * the source of truth for the relation. Passing an empty list unlinks them all.
 */
async function setStartupIncubators(
  trx: Transaction<DB>,
  startupUuid: string,
  incubatorIds: string[],
) {
  const uniqueIncubatorIds = Array.from(new Set(incubatorIds.filter(Boolean)));
  await trx
    .deleteFrom("startups_incubators")
    .where("startup_id", "=", startupUuid)
    .execute();
  if (uniqueIncubatorIds.length) {
    await trx
      .insertInto("startups_incubators")
      .values(
        uniqueIncubatorIds.map((incubator_id) => ({
          startup_id: startupUuid,
          incubator_id,
        })),
      )
      .execute();
  }
}

/**
 * Derive the legacy "primary" incubator kept on startups.incubator_id for
 * unversioned API consumers. Keeping the previous one when it is still selected
 * avoids the exposed value flip-flopping on every unrelated edit.
 */
function derivePrimaryIncubatorId(
  incubatorIds: string[],
  previousIncubatorId?: string | null,
) {
  return previousIncubatorId && incubatorIds.includes(previousIncubatorId)
    ? previousIncubatorId
    : incubatorIds[0];
}

export async function createStartup({
  formData: {
    startup: unsafeStartup,
    startupSponsors,
    startupEvents,
    startupPhases,
    newSponsors,
    newPhases,
  },
}: {
  formData: {
    startup: startupInfoUpdateSchemaType["startup"];
    startupEvents: startupInfoUpdateSchemaType["startupEvents"];
    startupPhases: startupInfoUpdateSchemaType["startupPhases"];
    startupSponsors: startupInfoUpdateSchemaType["startupSponsors"];
    newSponsors: startupInfoUpdateSchemaType["newSponsors"];
    newPhases: startupInfoUpdateSchemaType["newPhases"];
  };
}): Promise<{ uuid: string; ghid: string }> {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.id) {
    throw new AuthorizationError();
  }

  // The form schema is the only place holding the invariants (at least one
  // incubator, contact normalization); it has to be enforced server-side too.
  const startup = startupInfoUpdateSchema.shape.startup.parse(unsafeStartup);

  try {
    return await db.transaction().execute(async (trx) => {
      // incubator_ids feeds the startups_incubators join table, not the
      // startups row, which only carries the derived primary incubator.
      const { incubator_ids, ...startupData } = startup;
      const incubator_id = derivePrimaryIncubatorId(incubator_ids);
      // Insert startup data
      const res = await trx
        .insertInto("startups")
        .values({
          ghid: slugify(startup.name),
          ...startupData,
          incubator_id,
          techno: startup.techno ? JSON.stringify(startup.techno) : undefined,
          usertypes: startup.usertypes
            ? JSON.stringify(startup.usertypes)
            : undefined,
          thematiques: startup.thematiques
            ? JSON.stringify(startup.thematiques)
            : undefined,
        })
        .returning(["uuid", "ghid"])
        .executeTakeFirst();

      if (!res) {
        throw new Error("Startup data could not be inserted into the database");
      }

      const startupUuid = res.uuid;

      await setStartupIncubators(trx, startupUuid, incubator_ids);

      // Create new sponsors
      for (const newSponsor of newSponsors) {
        const sponsor = await trx
          .insertInto("organizations")
          .values(newSponsor)
          .returning("uuid")
          .executeTakeFirst();
        if (sponsor) {
          await trx
            .insertInto("startups_organizations")
            .values({
              organization_id: sponsor.uuid,
              startup_id: startupUuid,
            })
            .execute();
        }
      }

      // Add new sponsors
      for (const sponsorUuid of startupSponsors) {
        await trx
          .insertInto("startups_organizations")
          .values({
            organization_id: sponsorUuid,
            startup_id: startupUuid,
          })
          .execute();
      }

      // Create/update phases
      for (const startupPhase of startupPhases) {
        const args = {
          ...startupPhase,
          startup_id: startupUuid,
        };
        await trx
          .insertInto("phases")
          .values(args)
          .onConflict((oc) => {
            const { startup_id, name, ...rest } = args;
            return oc.column("startup_id").column("name").doUpdateSet(rest);
          })
          .returning("uuid")
          .executeTakeFirst();
      }

      // Create/update startup events
      await trx
        .deleteFrom("startup_events")
        .where("startup_id", "=", startupUuid)
        .execute();

      if (startupEvents.length) {
        await trx
          .insertInto("startup_events")
          .values(
            startupEvents.map((e) => ({
              ...e,
              startup_id: startupUuid,
            })),
          )
          .returning("uuid")
          .executeTakeFirst();
      }

      await addEvent(
        {
          action_code: EventCode.STARTUP_INFO_CREATED,
          created_by_username: session.user.id,
          action_on_startup: startupUuid,
          action_metadata: {
            value: {
              startup,
              startupEvents,
              startupPhases,
              startupSponsorIds: startupSponsors,
            },
          },
        },
        trx,
      );

      revalidatePath("/startups");
      return res;
    });
  } catch (error: any) {
    if (
      error.message.includes("duplicate key value violates unique constraint")
    ) {
      // Handle unique constraint violation
      throw new StartupUniqueConstraintViolationError(startup.name);
    }

    // Handle other potential errors (logging, rethrowing, etc.)
    console.error("Unexpected error:", error);
    throw error;
  }
}

export async function updateStartup({
  formData: {
    startup: unsafeStartup,
    startupSponsors,
    startupPhases,
    startupEvents,
    newSponsors,
  },
  startupUuid,
}: {
  formData: {
    startup: startupInfoUpdateSchemaType["startup"];
    startupEvents: startupInfoUpdateSchemaType["startupEvents"];
    startupPhases: startupInfoUpdateSchemaType["startupPhases"];
    startupSponsors: startupInfoUpdateSchemaType["startupSponsors"];
    newSponsors: startupInfoUpdateSchemaType["newSponsors"];
    newPhases: startupInfoUpdateSchemaType["newPhases"];
  };
  startupUuid: string;
}): Promise<{ uuid: string; ghid: string }> {
  // Le role Member perd l'edition de fiche produit : il reste editeur s'il est
  // agent public actif sur le produit (isStartupAgent).
  const subject = await assertCanEditStartup(startupUuid);

  // The form schema is the only place holding the invariants (at least one
  // incubator, contact normalization); it has to be enforced server-side too.
  const startup = startupInfoUpdateSchema.shape.startup.parse(unsafeStartup);

  const previousStartupData = await db
    .selectFrom("startups")
    .selectAll()
    .where("uuid", "=", startupUuid)
    .executeTakeFirst();
  if (!previousStartupData) {
    throw new NoDataError("Cannot find startup");
  }
  const previousStartupSponsors = z.array(sponsorSchema).parse(
    await db
      .selectFrom("organizations")
      .leftJoin(
        "startups_organizations",
        "organization_id",
        "organizations.uuid",
      )
      .where("startup_id", "=", previousStartupData.uuid)
      .select([
        // otherwise the uuid use is not the good one
        "organizations.uuid",
        "organizations.acronym",
        "organizations.type",
        "organizations.domaine_ministeriel",
        "organizations.ghid",
        "organizations.name",
      ])
      .execute(),
  );
  const previousStartupPhases = z
    .array(phaseSchema)
    .parse(
      await db
        .selectFrom("phases")
        .where("startup_id", "=", previousStartupData.uuid)
        .selectAll()
        .execute(),
    );
  const previousIncubatorIds = await getStartupIncubatorIds(startupUuid);

  return await db.transaction().execute(async (trx) => {
    // incubator_ids feeds the startups_incubators join table, not the startups
    // row, which only carries the derived primary incubator.
    const { incubator_ids, ...startupData } = startup;
    const incubator_id = derivePrimaryIncubatorId(
      incubator_ids,
      previousStartupData.incubator_id,
    );
    // update startup data
    const res = await trx
      .updateTable("startups")
      .set({
        ...startupData,
        incubator_id,
        techno: startup.techno ? JSON.stringify(startup.techno) : undefined,
        usertypes: startup.usertypes
          ? JSON.stringify(startup.usertypes)
          : undefined,
        thematiques: startup.thematiques
          ? JSON.stringify(startup.thematiques)
          : undefined,
      })
      .where("uuid", "=", startupUuid)
      .returning(["uuid", "ghid"])
      .executeTakeFirstOrThrow();

    await setStartupIncubators(trx, startupUuid, incubator_ids);

    // create new sponsors
    for (const newSponsor of newSponsors) {
      const sponsor = await trx
        .insertInto("organizations")
        .values(newSponsor)
        .returning("uuid")
        .executeTakeFirst();
      if (sponsor) {
        await trx
          .insertInto("startups_organizations")
          .values({
            organization_id: sponsor.uuid,
            startup_id: startupUuid,
          })
          .execute();
      }
    }
    // delete old sponsor
    const sponsorsUuidToRemove = _.difference(
      previousStartupSponsors.map((s) => s.uuid),
      startupSponsors,
    );
    for (const sponsorUuid of sponsorsUuidToRemove) {
      await trx
        .deleteFrom("startups_organizations")
        .where("organization_id", "=", sponsorUuid)
        .where("startup_id", "=", startupUuid)
        .execute();
    }

    // add new sponsors
    const sponsorUuidToAdd = _.difference(
      startupSponsors,
      previousStartupSponsors.map((s) => s.uuid),
    );
    for (const sponsorUuid of sponsorUuidToAdd) {
      await trx
        .insertInto("startups_organizations")
        .values({
          organization_id: sponsorUuid,
          startup_id: startupUuid,
        })
        .execute();
    }

    // delete old phase
    const phasesNameToRemove = _.difference(
      previousStartupPhases.map((s) => s.name),
      startupPhases.filter((s) => s.name).map((s) => s.name),
    );
    for (const phaseName of phasesNameToRemove) {
      await trx
        .deleteFrom("phases")
        .where("name", "=", phaseName)
        .where("startup_id", "=", startupUuid)
        .execute();
    }

    // create/update phases
    for (const startupPhase of startupPhases) {
      const args = {
        ...startupPhase,
        startup_id: startupUuid,
      };
      await trx
        .insertInto("phases")
        .values(args)
        .onConflict((oc) => {
          const { startup_id, name, ...rest } = args;
          return oc.column("startup_id").column("name").doUpdateSet(rest);
        })
        .returning("uuid")
        .executeTakeFirst();
    }

    // create/update startup events
    await trx
      .deleteFrom("startup_events")
      .where("startup_id", "=", startupUuid)
      .execute();

    if (startupEvents.length) {
      await trx
        .insertInto("startup_events")
        .values(
          startupEvents.map((e) => ({
            ...e,
            startup_id: startupUuid,
          })),
        )
        .returning("uuid")
        .executeTakeFirst();
    }

    const previousStartupEvents = await trx
      .selectFrom("startup_events")
      .selectAll()
      .where("startup_id", "=", startupUuid)
      .execute();

    const existingSponsorsUuid = _.difference(
      startupSponsors,
      sponsorsUuidToRemove,
    );
    await addEvent({
      action_code: EventCode.STARTUP_INFO_UPDATED,
      created_by_username: subject.username,
      action_on_startup: startupUuid,
      action_metadata: {
        value: {
          startup,
          startupEvents,
          startupPhases,
          startupSponsorIds: [...sponsorUuidToAdd, ...existingSponsorsUuid],
        },
        old_value: {
          startup: {
            ...previousStartupData,
            pitch: previousStartupData.pitch || "",
            incubator_ids: previousIncubatorIds,
            contact: previousStartupData.contact || "",
            description: previousStartupData.description || "",
            dsfr_status: previousStartupData.dsfr_status || "",
            techno: previousStartupData.techno as string[],
            thematiques: previousStartupData.thematiques as string[],
            usertypes: previousStartupData.usertypes as string[],
          },
          startupEvents: previousStartupEvents.map((event) =>
            startupEventToModel(event),
          ),
          startupPhases: previousStartupPhases,
          startupSponsorIds: previousStartupSponsors.map(
            (sponsor) => sponsor.uuid,
          ),
        },
      },
    });

    revalidatePath("/startups");

    return res;
  });
}

export const safeCreateStartup = withErrorHandling<
  UnwrapPromise<ReturnType<typeof createStartup>>,
  Parameters<typeof createStartup>
>(createStartup);

export const safeUpdateStartup = withErrorHandling<
  UnwrapPromise<ReturnType<typeof updateStartup>>,
  Parameters<typeof updateStartup>
>(updateStartup);

/**
 * Removes a member from a startup by ending their current mission association.
 *
 * This function preserves historical data by:
 * 1. Creating a new mission record with an end date of now (for audit trail)
 * 2. Removing the startup association from the member's current active mission
 *
 * @param startupUuid - The UUID of the startup to remove the member from
 * @param memberUuid - The UUID of the member (user) to remove
 * @throws {AuthorizationError} If the user is not authenticated
 * @throws {NoResultError} If no mission is found for this member/startup combination
 */
export const removeMember = async (
  startupUuid: string,
  memberUuid: string,
): Promise<void> => {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.id) {
    throw new AuthorizationError(
      `You don't have the right to access this function`,
    );
  }

  const canEdit = await canEditStartup(toAuthSubject(session)!, startupUuid);
  if (!canEdit) {
    throw new AuthorizationError(
      `You don't have the right to access this function`,
    );
  }
  // get the last start mission for this user/startup
  const lastStartupMission = await db
    .selectFrom("missions")
    .innerJoin(
      "missions_startups",
      "missions_startups.mission_id",
      "missions.uuid",
    )
    .select([
      "missions.uuid",
      "missions.start",
      "missions.employer",
      "missions.status",
    ])
    .where((eb) =>
      eb.and([
        eb("missions_startups.startup_id", "=", startupUuid),
        eb("missions.user_id", "=", memberUuid),
      ]),
    )
    .orderBy("start", "desc")
    .orderBy("end", "desc")
    .limit(1)
    .executeTakeFirstOrThrow();

  await db.transaction().execute(async (trx) => {
    // insert new mission with only the removed startup that ends now for history
    // except if mission started and ended today, probably an error
    const diffInDays = differenceInDays(new Date(), lastStartupMission.start);
    if (diffInDays > 0) {
      const insertedMission = await trx
        .insertInto("missions")
        .values({
          start: lastStartupMission.start,
          end: new Date(),
          user_id: memberUuid,
          employer: lastStartupMission.employer,
          status: lastStartupMission.status,
        })
        .returning("uuid")
        .executeTakeFirstOrThrow();
      await trx
        .insertInto("missions_startups")
        .values({ mission_id: insertedMission.uuid, startup_id: startupUuid })
        .execute();
    }
    // remove startup from current mission
    const res = await trx
      .deleteFrom("missions_startups")
      .where((eb) =>
        eb.and({
          "missions_startups.mission_id": lastStartupMission.uuid,
          "missions_startups.startup_id": startupUuid,
        }),
      )
      .executeTakeFirstOrThrow();
  });
  revalidatePath("/startups");
};

/**
 * Adds a member to a startup by creating a new mission association.
 *
 * This function:
 * 1. Looks up the user by their username to get their UUID
 * 2. Creates a new mission starting now and ending in 3 months
 * 3. Associates this mission with the specified startup
 *
 * @param startupUuid - The UUID of the startup to add the member to
 * @param username - The username (ghid) of the member to add
 * @throws {AuthorizationError} If the user is not authenticated
 * @throws {NoResultError} If no user is found with the given username
 */
export const addMember = async (
  startupUuid: string,
  username: string,
): Promise<void> => {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.id) {
    throw new AuthorizationError(
      `You don't have the right to access this function`,
    );
  }
  const canEdit = await canEditStartup(toAuthSubject(session)!, startupUuid);
  if (!canEdit) {
    throw new AuthorizationError(
      `You don't have the right to access this function`,
    );
  }
  const dbUser = await db
    .selectFrom("users")
    .where("username", "=", username)
    .select("uuid")
    .executeTakeFirstOrThrow();
  const memberUuid = dbUser.uuid;
  return db.transaction().execute(async (trx) => {
    const latestMission = await trx
      .selectFrom("missions")
      .select(["employer", "status"])
      .where("missions.user_id", "=", dbUser.uuid)
      .orderBy("start", "desc")
      .limit(1)
      .executeTakeFirst();
    const insertedMission = await trx
      .insertInto("missions")
      .values({
        start: new Date(),
        end: addMonths(new Date(), 3),
        user_id: memberUuid,
        status: latestMission?.status,
        employer: latestMission?.employer,
      })
      .returning("uuid")
      .executeTakeFirstOrThrow();
    await trx
      .insertInto("missions_startups")
      .values({ mission_id: insertedMission.uuid, startup_id: startupUuid })
      .returning("uuid")
      .execute();
    revalidatePath("/startups");
  });
};
