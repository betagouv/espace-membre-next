import { db } from "@/lib/kysely";

/** Return all organizations */
export function getAllOrganizations() {
    return db.selectFrom("organizations").selectAll().execute();
}

/** Return all organizations */
export async function getAllOrganizationsOptions() {
    const incubs = await getAllOrganizations();
    return incubs.map((incub) => ({
        value: incub.uuid,
        label: `${incub.name} ${incub.ghid ? `(${incub.ghid})` : ""}`,
    }));
}

/** Return organization by id */
export async function getOrganization(uuid: string) {
    return await db
        .selectFrom("organizations")
        .selectAll()
        .where("uuid", "=", uuid)
        .executeTakeFirst();
}

/** Return organization incubators */
export async function getOrganizationIncubators(uuid: string) {
    return await db
        .selectFrom("incubators")
        .selectAll()
        .where("owner_id", "=", uuid)
        .execute();
}

/** Return organization startups */
export async function getOrganizationStartups(uuid: string) {
    return db
        .selectFrom("startups")
        .select(({ selectFrom }) => [
            "startups.uuid",
            "name",
            "pitch",
            "ghid",
            // phase actuelle
            selectFrom("phases")
                .select("name")
                .whereRef("phases.startup_id", "=", "startups.uuid")
                .where((eb) =>
                    eb(
                        "phases.start",
                        "=",
                        eb
                            .selectFrom("phases")
                            .select(eb.fn.max("phases.start").as("max_start"))
                            .whereRef("phases.startup_id", "=", "startups.uuid")
                            .limit(1),
                    ),
                )
                .orderBy("start", "desc")
                .limit(1)
                .as("phase"),
        ])
        .leftJoin(
            "startups_organizations",
            "startups_organizations.startup_id",
            "startups.uuid",
        )
        .where("startups_organizations.organization_id", "=", uuid)
        .orderBy("name")
        .execute();
}
