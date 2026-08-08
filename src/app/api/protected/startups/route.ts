import { NextRequest } from "next/server";
import { z } from "zod";

import { getStartupsWithPhases } from "@/lib/kysely/queries/startups";
import { currentPhaseName, parsePhaseFilter } from "@/lib/startupPhase";
import { startupToModel } from "@/models/mapper";
import { startupApiResponseSchema } from "@/models/startup";

export const GET = async (req: NextRequest) => {
  const phaseFilter = parsePhaseFilter(req.nextUrl.searchParams.get("phase"));

  const rows = await getStartupsWithPhases();
  let startups = rows.map((row) => ({
    ...startupToModel(row),
    phases: row.phases,
    current_phase: currentPhaseName(row.phases),
  }));

  // Pas de filtre par defaut : on renvoie toutes les startups. ?phase=... ne
  // conserve que celles dont la phase courante figure dans la liste demandee.
  if (phaseFilter.length) {
    startups = startups.filter(
      (startup) =>
        !!startup.current_phase && phaseFilter.includes(startup.current_phase),
    );
  }

  const body = z.array(startupApiResponseSchema).parse(startups);
  return Response.json(body);
};
