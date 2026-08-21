import { parsePagination } from "@/lib/api/pagination";
import { invalidRequest, methodNotAllowed } from "@/lib/api/problem";
import { withApiV1 } from "@/lib/api/withApiV1";
import {
  countApiStartups,
  listApiStartups,
} from "@/lib/kysely/queries/startups";
import { toApiStartup } from "@/lib/api/startupRepresentation";
import { parsePhaseFilter } from "@/lib/startupPhase";
import { jsonCollection } from "@/models/api/envelope";
import { startupApiResponseSchema } from "@/models/api/startup";

// Route de données live : à rendre à la demande, jamais à prérender au build.
export const dynamic = "force-dynamic";

export const GET = withApiV1({ scope: "startups:read" }, async (req, ctx) => {
  const pagination = parsePagination(req.nextUrl.searchParams);
  if (!pagination.success) {
    return invalidRequest(pagination.error, { instance: req.nextUrl.pathname });
  }
  const { limit, offset } = pagination.data;

  // ?phase descend en SQL : le total doit porter sur l'ensemble filtre.
  const filters = {
    phases: parsePhaseFilter(req.nextUrl.searchParams.get("phase")),
  };

  const [total, rows] = await Promise.all([
    countApiStartups(ctx.key.read, filters),
    listApiStartups(ctx.key.read, filters, { limit, offset }),
  ]);

  return jsonCollection(startupApiResponseSchema, rows.map(toApiStartup), {
    total,
    limit,
    offset,
    perimeter: ctx.key.readLabel,
  });
});

export const POST = methodNotAllowed(["GET"]);
