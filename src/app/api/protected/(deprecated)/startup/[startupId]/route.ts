import { HttpStatusCode } from "axios";
import { NextRequest } from "next/server";

import { getStartup } from "@/lib/kysely/queries";
import { getStartupIncubators } from "@/lib/kysely/queries/incubators";
import { incubatorToModel, startupToModel } from "@/models/mapper";
import { deprecationHeaders } from "@/lib/deprecation";

export const GET = async (
  _: NextRequest,
  { params: { startupId } }: { params: { startupId: string } },
) => {
  const headers = deprecationHeaders(`/api/protected/startups/${startupId}`);
  const dbStartup = await getStartup({ ghid: startupId });

  if (!dbStartup) {
    return Response.json(
      { error: "No startup found for this id" },
      { status: HttpStatusCode.NotFound, headers },
    );
  }

  const startup = startupToModel(dbStartup);
  const incubators = (await getStartupIncubators(dbStartup.uuid)).map(
    incubatorToModel,
  );
  // Derived from the list rather than re-queried: startups.incubator_id is
  // nullable, and fetching it on its own used to 500 on a startup without one.
  const incubator =
    incubators.find((i) => i.uuid === startup.incubator_id) ?? null;

  return Response.json(
    {
      ...startup,
      incubator,
      incubators,
    },
    { headers },
  );
};
