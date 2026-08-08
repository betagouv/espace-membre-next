import { z } from "zod";

import { getAllIncubators } from "@/lib/kysely/queries/incubators";
import { incubatorApiResponseSchema } from "@/models/incubator";
import { incubatorToModel } from "@/models/mapper";

// Route de données live : à rendre à la demande, jamais à prérender au build
// (sans quoi Next tente d'exécuter la requête DB au build, où il n'y a pas de base).
export const dynamic = "force-dynamic";

export const GET = async () => {
  const incubators = (await getAllIncubators()).map(incubatorToModel);
  const body = z.array(incubatorApiResponseSchema).parse(incubators);
  return Response.json(body);
};
