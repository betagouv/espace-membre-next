import { db, jsonArrayFrom } from "@/lib/kysely";
import { StartupPhase } from "@/models/startup";

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

/** Return incubator startups */
export function getIncubatorStartups(uuid: string) {
    return db
        .selectFrom("startups")
        .select(({ selectFrom }) => [
            "uuid",
            "name",
            "pitch",
            "ghid",
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

                            .limit(1)
                    )
                )
                .orderBy("start", "desc")
                .limit(1)
                .as("phase"),
        ])
        .where("incubator_id", "=", uuid)
        .orderBy("name")
        .execute();
}

/** Return all incubators */
export async function getIncubator(uuid: string) {
    return await db
        .selectFrom("incubators")
        .leftJoin("organizations", "organizations.uuid", "incubators.owner_id")
        .select([
            "incubators.title",
            "incubators.uuid",
            "incubators.description",
            "incubators.contact",
            "incubators.short_description",
            "incubators.ghid",
            "incubators.github",
            "incubators.owner_id",
            "incubators.address",
            "incubators.highlighted_startups",
            "incubators.website",
            "organizations.name as organization_name",
        ])
        .where("incubators.uuid", "=", uuid)
        .executeTakeFirstOrThrow();
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

export function getIncubatorTeams(uuid: string) {
    return db
        .selectFrom("incubators")
        .leftJoin("teams", "teams.incubator_id", "incubators.uuid")
        .select(["teams.name", "teams.mission", "teams.uuid"])
        .where("incubators.uuid", "=", uuid)
        .orderBy("teams.name")
        .execute();
}
