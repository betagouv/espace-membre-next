import { HttpStatusCode } from 'axios';
import { NextRequest } from 'next/server';
import { z } from 'zod';

import { getAllStartups } from '@/lib/kysely/queries';
import { getAllIncubators, getAllIncubatorsMembers } from '@/lib/kysely/queries/incubators';
import { incubatorToModel, startupToModel } from '@/models/mapper';
import { convertSearchParamsToRecord } from '@/utils/url';

const enum IncubatorIncludes {
    STARTUPS = 'startups',
    MEMBERS = 'members'
}

const IncubatorIncludesSchema = z.union([z.literal(IncubatorIncludes.STARTUPS), z.literal(IncubatorIncludes.MEMBERS)], {
  message: "Inclusion non valide",
});
const queryInput = z.object({
  includes: z
    .array(IncubatorIncludesSchema)
    .or(IncubatorIncludesSchema)
    .transform(value => (Array.isArray(value) ? value : [value]))
    .refine(items => new Set(items).size === items.length, "Il ne peut y avoir plusieurs inclusions identiques.")
    .optional(),
});

export const GET = async (req: NextRequest) => {
    const { success, data: searchParams, error } = queryInput.safeParse(convertSearchParamsToRecord(req.nextUrl.searchParams));
    if (!success) {
        return Response.json({ error: error.flatten().fieldErrors }, { status: HttpStatusCode.UnprocessableEntity });
    }

    const incubators = (await getAllIncubators()).map(incubatorToModel);

    if (searchParams.includes?.length) {
        const withStartups = searchParams.includes.includes(IncubatorIncludes.STARTUPS);
        const withMembers = searchParams.includes.includes(IncubatorIncludes.MEMBERS);

        if (withStartups) {
            const startups = await getAllStartups();
            type IncubatorWithStartups = typeof incubators[0] & { startups: ReturnType<typeof startupToModel>[] };
            for (const incubator of incubators) {
                const incubatorStartups = startups.filter(startup => startup.incubator_id === incubator.uuid);
                (incubator as IncubatorWithStartups).startups = incubatorStartups.map(startupToModel);
            }
        }

        if (withMembers) {
            const incubatorMembersList = await getAllIncubatorsMembers();
            type IncubatorWithMembers = typeof incubators[0] & { members: { uuid: string, fullname: string }[] };
            for (const incubator of incubators) {
                const incubatorMembers = incubatorMembersList.find(incubatorMember => incubatorMember.uuid === incubator.uuid);
                (incubator as IncubatorWithMembers).members = incubatorMembers?.members ?? [];
            }
        }
    }

    return Response.json(incubators);
}