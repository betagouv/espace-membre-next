import { NextRequest } from "next/server";
import { z } from "zod";

import { getStartupsWithPhases } from "@/lib/kysely/queries/startups";
import { getAllStartupsIncubators } from "@/lib/kysely/queries/incubators";
import { currentPhaseName, parsePhaseFilter } from "@/lib/startupPhase";
import { startupToModel } from "@/models/mapper";
import { startupApiResponseSchema } from "@/models/api/startup";

// Route de données live : à rendre à la demande, jamais à prérender au build.
export const dynamic = "force-dynamic";

export const GET = async (req: NextRequest) => {
  const phaseFilter = parsePhaseFilter(req.nextUrl.searchParams.get("phase"));

  const rows = await getStartupsWithPhases();
  // Resolu en memoire : joindre la table de liaison dupliquerait les produits
  // co-incubes dans la liste.
  const incubatorIdsByStartup = new Map<string, string[]>();
  for (const link of await getAllStartupsIncubators()) {
    const ids = incubatorIdsByStartup.get(link.startup_id) ?? [];
    ids.push(link.incubator_id);
    incubatorIdsByStartup.set(link.startup_id, ids);
  }
  let startups = rows.map((row) => ({
    ...startupToModel(row),
    incubator_ids: incubatorIdsByStartup.get(row.uuid) ?? [],
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
