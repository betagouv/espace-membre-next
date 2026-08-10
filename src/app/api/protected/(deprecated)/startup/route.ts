import { HttpStatusCode } from "axios";
import { NextRequest } from "next/server";
import { z } from "zod";

import { getAllStartups } from "@/lib/kysely/queries";
import {
  getAllIncubators,
  getAllStartupsIncubators,
} from "@/lib/kysely/queries/incubators";
import { incubatorToModel, startupToModel } from "@/models/mapper";
import { convertSearchParamsToRecord } from "@/lib/url";
import { deprecationHeaders } from "@/lib/deprecation";

const enum StartupIncludes {
  INCUBATORS = "incubators",
  // MEMBERS = 'members'
}
const queryInput = z.object({
  includes: z.literal(StartupIncludes.INCUBATORS).optional(),
  // TODO: pour plus tard
  // includes: z.array(z.union([z.literal(StartupIncludes.INCUBATOR), z.literal(StartupIncludes.MEMBERS)], {
  //     message: "Inclusion non valide"
  // })).refine(items => new Set(items).size === items.length, "Il ne peut y avoir plusieurs inclusions identiques.").optional()
});

type IncubatorRow = Awaited<ReturnType<typeof getAllIncubators>>[number];

const toIncubatorModel = (incubator: IncubatorRow) =>
  incubatorToModel({ ...incubator, organization_name: null });

/**
 * Attach the primary incubator and the full co-incubation list to each startup.
 * The list keeps the order of getAllStartupsIncubators so the payload is stable.
 */
const attachIncubators = async <
  T extends { uuid: string; incubator_id: string },
>(
  startups: T[],
) => {
  const incubatorsByUuid = new Map(
    (await getAllIncubators()).map((incubator) => [incubator.uuid, incubator]),
  );
  const linkedIdsByStartup = new Map<string, string[]>();
  for (const link of await getAllStartupsIncubators()) {
    const ids = linkedIdsByStartup.get(link.startup_id) ?? [];
    ids.push(link.incubator_id);
    linkedIdsByStartup.set(link.startup_id, ids);
  }

  return startups.map((startup) => {
    const primary = incubatorsByUuid.get(startup.incubator_id);
    return {
      ...startup,
      incubator: primary ? toIncubatorModel(primary) : null,
      incubators: (linkedIdsByStartup.get(startup.uuid) ?? [])
        .map((id) => incubatorsByUuid.get(id))
        .filter((incubator) => incubator !== undefined)
        .map(toIncubatorModel),
    };
  });
};

export const GET = async (req: NextRequest) => {
  const headers = deprecationHeaders("/api/protected/startups");
  const {
    success,
    data: searchParams,
    error,
  } = queryInput.safeParse(
    convertSearchParamsToRecord(req.nextUrl.searchParams),
  );
  if (!success) {
    return Response.json(
      { error: error.flatten().fieldErrors },
      { status: HttpStatusCode.UnprocessableEntity, headers },
    );
  }

  const startups = (await getAllStartups()).map(startupToModel);

  return Response.json(
    searchParams.includes === StartupIncludes.INCUBATORS
      ? await attachIncubators(startups)
      : startups,
    { headers },
  );
};
