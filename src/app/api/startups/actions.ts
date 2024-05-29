"use server";

import slugify from "@sindresorhus/slugify";
import _ from "lodash";
import { getServerSession } from "next-auth";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

import { db } from "@/lib/kysely";
import { startupInfoUpdateSchemaType } from "@/models/actions/startup";
import { sponsorSchema } from "@/models/sponsor";
import { phaseSchema } from "@/models/startup";
import { authOptions } from "@/utils/authoptions";

export async function createStartup({
    formData: {
        startup,
        startupSponsors,
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

    try {
        await db.transaction().execute(async (trx) => {
            // update startup data
            console.log("LCS NEW se", startup);

            const res = await trx
                .insertInto("startups")
                .values({
                    id: slugify(startup.name),
                    ...startup,
                    usertypes: JSON.stringify(startup.usertypes),
                    thematiques: JSON.stringify(startup.thematiques),
                })
                .returning("uuid")
                .executeTakeFirst();
            console.log("LCS NEW se 2", res);

            if (!res) {
                throw new Error("Startup data could not be inserted into db");
            }
            const startupUuid = res.uuid;
            console.log("LCS NEW UUID", res.uuid);
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
        });
    } catch (error) {
        console.error("Transaction failed:", error);
    }
}

export async function updateStartup({
    formData: {
        startup,
        startupSponsors,
        startupPhases,
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

    try {
        await db.transaction().execute(async (trx) => {
            // update startup data
            await trx
                .updateTable("startups")
                .set(startup)
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
            const phasesUuidToRemove = _.difference(
                previousStartupPhases.map((s) => s.uuid),
                startupPhases.filter((s) => s.uuid).map((s) => s.uuid)
            );
            for (const phaseUuid of phasesUuidToRemove) {
                await trx
                    .deleteFrom("phases")
                    .where("uuid", "=", phaseUuid)
                    .where("startup_id", "=", startupUuid)
                    .execute();
            }

            // create/update phases
            console.log(startupPhases);
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
        });
    } catch (error) {
        console.error("Transaction failed:", error);
    }
}
