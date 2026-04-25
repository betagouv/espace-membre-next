import { HttpStatusCode } from "axios";
import { NextRequest } from "next/server";

import { getStartup } from "@/lib/kysely/queries";
import { getIncubator } from "@/lib/kysely/queries/incubators";
import { incubatorToModel, startupToModel } from "@/models/mapper";

export const GET = async (_: NextRequest, props: { params: Promise<{ startupId: string }> }) => {
  const params = await props.params;

  const {
    startupId
  } = params;

  const dbStartup = await getStartup({ ghid: startupId });

  if (!dbStartup) {
    return Response.json(
      { error: "No startup found for this id" },
      { status: HttpStatusCode.NotFound },
    );
  }

  const startup = startupToModel(dbStartup);
  const incubator = incubatorToModel(await getIncubator(startup.incubator_id));

  return Response.json({
    ...startup,
    incubator,
  });
};
