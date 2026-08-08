import { z } from "zod";

import { getAllIncubators } from "@/lib/kysely/queries/incubators";
import { incubatorApiResponseSchema } from "@/models/incubator";
import { incubatorToModel } from "@/models/mapper";

export const GET = async () => {
  const incubators = (await getAllIncubators()).map(incubatorToModel);
  const body = z.array(incubatorApiResponseSchema).parse(incubators);
  return Response.json(body);
};
