import { parsePagination } from "@/lib/api/pagination";
import { invalidRequest, methodNotAllowed } from "@/lib/api/problem";
import { withApiV1 } from "@/lib/api/withApiV1";
import {
  countApiIncubators,
  listApiIncubators,
} from "@/lib/kysely/queries/incubators";
import { jsonCollection } from "@/models/api/envelope";
import { incubatorApiResponseSchema } from "@/models/api/incubator";

// Route de données live : à rendre à la demande, jamais à prérender au build
// (sans quoi Next tente d'exécuter la requête DB au build, où il n'y a pas de base).
export const dynamic = "force-dynamic";

// Une collection ne repond jamais 403 : hors perimetre, elle est simplement
// vide.
export const GET = withApiV1({ scope: "incubators:read" }, async (req, ctx) => {
  const pagination = parsePagination(req.nextUrl.searchParams);
  if (!pagination.success) {
    return invalidRequest(pagination.error, { instance: req.nextUrl.pathname });
  }
  const { limit, offset } = pagination.data;

  const [total, rows] = await Promise.all([
    countApiIncubators(ctx.key.read),
    listApiIncubators(ctx.key.read, { limit, offset }),
  ]);

  return jsonCollection(incubatorApiResponseSchema, rows, {
    total,
    limit,
    offset,
    perimeter: ctx.key.readLabel,
  });
});

export const POST = methodNotAllowed(["GET"]);
