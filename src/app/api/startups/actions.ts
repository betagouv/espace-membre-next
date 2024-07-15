"use server";

import slugify from "@sindresorhus/slugify";
import _ from "lodash";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { db } from "@/lib/kysely";
import { startupInfoUpdateSchemaType } from "@/models/actions/startup";
import { sponsorSchema } from "@/models/sponsor";
import { phaseSchema } from "@/models/startup";
import { authOptions } from "@/utils/authoptions";
import { addEvent } from "@/lib/events";
import { EventCode } from "@/models/actionEvent";

export async function createStartup({
    formData: {
        startup,
        startupSponsors,
        startupEvents,
        startupPhases,
        newSponsors,
        newPhases,
    },
}: {
    formData: startupInfoUpdateSchemaType;
}) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.id) {
        throw new Error(`You don't have the right to access this function`);
    }

    await db.transaction().execute(async (trx) => {
        // update startup data
        const res = await trx
            .insertInto("startups")
            .values({
                ghid: slugify(startup.name),
                ...startup,
                techno: startup.techno
                    ? JSON.stringify(startup.techno)
                    : undefined,
                usertypes: startup.usertypes
                    ? JSON.stringify(startup.usertypes)
                    : undefined,
                thematiques: startup.thematiques
                    ? JSON.stringify(startup.thematiques)
                    : undefined,
            })
            .returning("uuid")
            .executeTakeFirst();
        if (!res) {
            throw new Error("Startup data could not be inserted into db");
        }
        const startupUuid = res.uuid;
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
        // add new sponsors
        for (const sponsorUuid of startupSponsors) {
            await trx
                .insertInto("startups_organizations")
                .values({
                    organization_id: sponsorUuid,
                    startup_id: startupUuid,
                })
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
                    return oc
                        .column("startup_id")
                        .column("name")
                        .doUpdateSet(rest);
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
                    }))
                )
                .returning("uuid")
                .executeTakeFirst();
        }

        addEvent({
            action_code: EventCode.STARTUP_INFO_CREATED,
            created_by_username: session.user.id,
        });

        revalidatePath("/startups");
    });
}

export async function updateStartup({
    formData: {
        startup,
        startupSponsors,
        startupPhases,
        startupEvents,
        newSponsors,
        newPhases,
    },
    startupUuid,
}: {
    formData: startupInfoUpdateSchemaType;
    startupUuid: string;
}) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.id) {
        throw new Error(`You don't have the right to access this function`);
    }
    const previousStartupData = await db
        .selectFrom("startups")
        .selectAll()
        .where("uuid", "=", startupUuid)
        .executeTakeFirst();
    if (!previousStartupData) {
        throw new Error("Cannot find startup");
    }
    const previousStartupSponsors = z.array(sponsorSchema).parse(
        await db
            .selectFrom("organizations")
            .leftJoin(
                "startups_organizations",
                "organization_id",
                "organizations.uuid"
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
            .execute()
    );
    const previousStartupPhases = z
        .array(phaseSchema)
        .parse(
            await db
                .selectFrom("phases")
                .where("startup_id", "=", previousStartupData.uuid)
                .selectAll()
                .execute()
        );

    await db.transaction().execute(async (trx) => {
        // update startup data
        await trx
            .updateTable("startups")
            .set({
                ...startup,
                techno: startup.techno
                    ? JSON.stringify(startup.techno)
                    : undefined,
                usertypes: startup.usertypes
                    ? JSON.stringify(startup.usertypes)
                    : undefined,
                thematiques: startup.thematiques
                    ? JSON.stringify(startup.thematiques)
                    : undefined,
            })
            .where("uuid", "=", startupUuid)
            .execute();

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
            startupSponsors
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
            previousStartupSponsors.map((s) => s.uuid)
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
            startupPhases.filter((s) => s.name).map((s) => s.name)
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
                    return oc
                        .column("startup_id")
                        .column("name")
                        .doUpdateSet(rest);
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
                    }))
                )
                .returning("uuid")
                .executeTakeFirst();
        }
        addEvent({
            action_code: EventCode.STARTUP_INFO_UPDATED,
            created_by_username: session.user.id,
        });

        revalidatePath("/startups");
    });
}
