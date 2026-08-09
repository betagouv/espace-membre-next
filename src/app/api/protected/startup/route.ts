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

export const GET = async (req: NextRequest) => {
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
      { status: HttpStatusCode.UnprocessableEntity },
    );
  }

  const startups = (await getAllStartups()).map(startupToModel);

  if (searchParams.includes?.length) {
    const withIncubator = searchParams.includes === StartupIncludes.INCUBATORS;
    const incubators = withIncubator ? await getAllIncubators() : [];
    const links = withIncubator ? await getAllStartupsIncubators() : [];
    const incubatorIdsByStartup = new Map<string, string[]>();
    for (const link of links) {
      const ids = incubatorIdsByStartup.get(link.startup_id) ?? [];
      ids.push(link.incubator_id);
      incubatorIdsByStartup.set(link.startup_id, ids);
    }

    type StartupWithIncubator = (typeof startups)[0] & {
      incubator: ReturnType<typeof incubatorToModel> | null;
      incubators: ReturnType<typeof incubatorToModel>[];
    };
    for (const startup of startups) {
      if (withIncubator) {
        const incubator = incubators.find(
          (incubator) => startup.incubator_id === incubator.uuid,
        );
        (startup as StartupWithIncubator).incubator = incubator
          ? incubatorToModel({
              ...incubator,
              organization_name: null,
            })
          : null;
        (startup as StartupWithIncubator).incubators = (
          incubatorIdsByStartup.get(startup.uuid) ?? []
        )
          .map((id) => incubators.find((incubator) => incubator.uuid === id))
          .filter((incubator) => incubator !== undefined)
          .map((incubator) =>
            incubatorToModel({ ...incubator, organization_name: null }),
          );
      }
    }
  }

  return Response.json(startups);
};
