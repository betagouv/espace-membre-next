import { HttpStatusCode } from "axios";
import { NextRequest } from "next/server";
import { z } from "zod";

import { getIncubatorByGhid } from "@/lib/kysely/queries/incubators";
import { getStartupsWithPhases } from "@/lib/kysely/queries/startups";
import { currentPhaseName, parsePhaseFilter } from "@/lib/startupPhase";
import { incubatorStartupApiResponseSchema } from "@/models/startup";

export const GET = async (
  req: NextRequest,
  { params: { ghid } }: { params: { ghid: string } },
) => {
  const incubator = await getIncubatorByGhid(ghid);
  if (!incubator) {
    return Response.json(
      { error: "No incubator found for this ghid" },
      { status: HttpStatusCode.NotFound },
    );
  }

  const phaseFilter = parsePhaseFilter(req.nextUrl.searchParams.get("phase"));

  const rows = await getStartupsWithPhases(incubator.uuid);
  let startups = rows.map((row) => ({
    uuid: row.uuid,
    ghid: row.ghid,
    name: row.name,
    pitch: row.pitch,
    phases: row.phases,
    current_phase: currentPhaseName(row.phases),
  }));

  // Pas de filtre par defaut. ?phase=... ne conserve que les startups dont la
  // phase courante figure dans la liste demandee.
  if (phaseFilter.length) {
    startups = startups.filter(
      (startup) =>
        !!startup.current_phase && phaseFilter.includes(startup.current_phase),
    );
  }

  const body = z.array(incubatorStartupApiResponseSchema).parse(startups);
  return Response.json(body);
};
