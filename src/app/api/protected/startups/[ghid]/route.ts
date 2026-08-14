import { HttpStatusCode } from "axios";

import { getStartupIncubators } from "@/lib/kysely/queries/incubators";
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
  // Une seule requete, triee par titre, qui couvre aussi le cas d'un produit
  // sans incubateur principal : incubator en est deduit.
  const incubators = (await getStartupIncubators(dbStartup.uuid)).map(
    incubatorToModel,
  );
  const incubator =
    incubators.find(({ uuid }) => uuid === startup.incubator_id) ?? null;

  const body = startupWithIncubatorApiResponseSchema.parse({
    ...startup,
    incubator,
    incubators,
    phases: dbStartup.phases,
    current_phase: currentPhaseName(dbStartup.phases),
  });
  return Response.json(body);
};
