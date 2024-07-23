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

/** Return all organizations */
export async function getOrganization(uuid: string) {
    return await db
        .selectFrom("organizations")
        .selectAll()
        .where("uuid", "=", uuid)
        .executeTakeFirst();
}
