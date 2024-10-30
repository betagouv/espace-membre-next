import { parseAsArrayOf, parseAsJson, useQueryState } from "nuqs";
import z from "zod";

import { CommunityProps } from ".";

export const communityFilterSchema = z.object({
    type: z.enum([
        "active_only",
        "competence",
        "domaine",
        "user",
        "incubator",
        "startup",
    ]),
    value: z.union([z.string(), z.boolean()]).optional(),
});

export type CommunityFilterSchemaType = z.infer<typeof communityFilterSchema>;

export const communityQueryParser = parseAsArrayOf(
    parseAsJson(communityFilterSchema.parse)
).withDefault([]);

// return if user is still active at community level
export const isUserActive = (
    missions: CommunityProps["users"][number]["missions"]
) => {
    return missions.filter((m) => !m.end || m.end > new Date()).length > 0;
};

// list unique active startups from someone missions
export const getStartupsFromMissions = (
    missions: CommunityProps["users"][number]["missions"],
    startupOptions: CommunityProps["startupOptions"]
) => {
    return (
        missions
            // only use active missions
            .filter((m) => !m.end || new Date(m.end) > new Date())
            // only missions with startups
            .filter((m) => m.startups && m.startups.length > 0)
            // extract startups data
            .flatMap(
                (m) =>
                    m.startups
                        ?.map((s) => {
                            // get full startup info
                            return startupOptions.find((s2) => s2.value === s);
                        })
                        .filter(Boolean) || []
            )
            // uniquify
            .filter(
                (s, i, a) =>
                    !a.slice(i + 1).find((t) => t?.value === (s && s.value))
            )
    );
};
