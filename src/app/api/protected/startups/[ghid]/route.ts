import { HttpStatusCode } from "axios";

import { getIncubator } from "@/lib/kysely/queries/incubators";
import { getStartupWithPhases } from "@/lib/kysely/queries/startups";
import { currentPhaseName } from "@/lib/startupPhase";
import { incubatorToModel, startupToModel } from "@/models/mapper";
import { startupWithIncubatorApiResponseSchema } from "@/models/api/startup";

// On conserve la semantique existante : le parametre de chemin est le ghid.
export const GET = async (
  _: Request,
  segmentData: { params: Promise<{ ghid: string }> },
) => {
  const { ghid } = await segmentData.params;
  const dbStartup = await getStartupWithPhases(ghid);
  if (!dbStartup) {
    return Response.json(
      { error: "No startup found for this ghid" },
      { status: HttpStatusCode.NotFound },
    );
  }

  const startup = startupToModel(dbStartup);
  const incubator = startup.incubator_id
    ? incubatorToModel(await getIncubator(startup.incubator_id))
    : null;

  const body = startupWithIncubatorApiResponseSchema.parse({
    ...startup,
    incubator,
    phases: dbStartup.phases,
    current_phase: currentPhaseName(dbStartup.phases),
  });
  return Response.json(body);
};
