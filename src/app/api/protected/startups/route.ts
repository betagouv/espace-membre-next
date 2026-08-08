import { z } from "zod";

import { getAllStartups } from "@/lib/kysely/queries";
import { startupToModel } from "@/models/mapper";
import { startupApiResponseSchema } from "@/models/startup";

export const GET = async () => {
  const startups = (await getAllStartups()).map(startupToModel);
  const body = z.array(startupApiResponseSchema).parse(startups);
  return Response.json(body);
};
