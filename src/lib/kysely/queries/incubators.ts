import { db, jsonArrayFrom } from "@/lib/kysely";

/** Return all incubators */
export function getAllIncubators() {
    return db.selectFrom("incubators").selectAll().execute();
}

/** Return all incubators */
export async function getAllIncubatorsOptions() {
    const incubs = await getAllIncubators();
    return incubs.map((incub) => ({
        value: incub.uuid,
        label: `${incub.title} ${incub.ghid ? `(${incub.ghid})` : ""}`,
    }));
}

/** Return all incubators */
export async function getIncubator(uuid: string) {
    return await db
        .selectFrom("incubators")
        .selectAll()
        .where("uuid", "=", uuid)
        .executeTakeFirst();
}

export async function getAllIncubatorsMembers() {
    return db
        .selectFrom("incubators")
        .select(({ selectFrom, eb }) => [
            "incubators.uuid",
            "incubators.title",
            jsonArrayFrom(
                // startups members affiliated to incubator
                eb
                    .selectFrom("users")
                    .select(["users.uuid", "users.fullname"])
                    .leftJoin("missions", "missions.user_id", "users.uuid")
                    .leftJoin(
                        "missions_startups",
                        "missions_startups.mission_id",
                        "missions.uuid"
                    )
                    .leftJoin(
                        "startups",
                        "startups.uuid",
                        "missions_startups.startup_id"
                    )
                    .whereRef("startups.incubator_id", "=", "incubators.uuid")
                    .union(() =>
                        // team members affiliated to incubator
                        eb
                            .selectFrom("users")
                            .select(["users.uuid", "users.fullname"])
                            .leftJoin(
                                "users_teams",
                                "users_teams.user_id",
                                "users.uuid"
                            )
                            .leftJoin(
                                "teams",
                                "teams.uuid",
                                "users_teams.team_id"
                            )
                            .whereRef(
                                "teams.incubator_id",
                                "=",
                                "incubators.uuid"
                            )
                    )
            ).as("members"),
        ])
        .execute();
}
