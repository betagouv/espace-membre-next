import { Selectable } from "kysely";

import { startupSchemaType, userStartupSchemaType } from "../startup";
import { Startups } from "@/@types/db";
import { getStartup } from "@/lib/kysely/queries";
import { getUserStartups } from "@/lib/kysely/queries/users";

export function startupToModel(
    startup: Awaited<ReturnType<typeof getStartup>>
): startupSchemaType {
    if (!startup) {
        throw new Error("No startups");
    }
    return {
        ...startup,
        mailing_list: startup.mailing_list || undefined,
        contact: startup.contact || "",
        incubator_id: startup.incubator_id as string,
        description: startup.description || "",
        pitch: startup.pitch || "",
        techno: (startup.techno && Array.isArray(startup.techno)
            ? startup.techno
            : []) as string[],
        thematiques: (startup.thematiques && Array.isArray(startup.thematiques)
            ? startup.thematiques
            : []) as string[],
        usertypes: (startup.usertypes && Array.isArray(startup.usertypes)
            ? startup.usertypes
            : []) as string[],
        repository: startup.repository || undefined,
    };
}

export function userStartupToModel(
    startup: Awaited<ReturnType<typeof getUserStartups>>[0]
): userStartupSchemaType {
    return {
        ghid: startup.ghid!,
        incubator_id: startup.incubator_id!,
        end: startup.end,
        start: startup.start!,
        name: startup.name!,
        uuid: startup.uuid!,
    };
}
