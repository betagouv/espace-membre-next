import { db } from "@/lib/kysely";

export const getLatests = () =>
    db
        .selectFrom("startups")
        .innerJoin("incubators", "incubators.uuid", "startups.incubator_id")
        .select([
            "startups.created_at",
            "startups.uuid",
            "startups.name",
            "startups.pitch",
            "incubators.title as incubator",
            "incubators.uuid as incubatorUuid",
        ])
        .orderBy("created_at", "desc")
        .limit(10)
        .execute();
