import { HttpStatusCode } from "axios";
import { z } from "zod";

import {
  getIncubatorByGhid,
  getIncubatorStartups,
} from "@/lib/kysely/queries/incubators";
import { incubatorStartupApiResponseSchema } from "@/models/startup";

export const GET = async (
  _: Request,
  { params: { ghid } }: { params: { ghid: string } },
) => {
  const incubator = await getIncubatorByGhid(ghid);
  if (!incubator) {
    return Response.json(
      { error: "No incubator found for this ghid" },
      { status: HttpStatusCode.NotFound },
    );
  }

  const startups = await getIncubatorStartups(incubator.uuid);
  const body = z.array(incubatorStartupApiResponseSchema).parse(startups);
  return Response.json(body);
};
