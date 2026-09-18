import { toResourceRef } from "@/lib/api/identifier";
import { parsePagination } from "@/lib/api/pagination";
import { canAccessIncubator } from "@/lib/api/perimeter";
import {
  invalidRequest,
  methodNotAllowed,
  problem,
} from "@/lib/api/problem";
import { withApiV1 } from "@/lib/api/withApiV1";
import { getIncubatorByRef } from "@/lib/kysely/queries/incubators";
import {
  countApiStartups,
  listApiStartups,
} from "@/lib/kysely/queries/startups";
import { currentPhaseName, parsePhaseFilter } from "@/lib/startupPhase";
import { jsonCollection } from "@/models/api/envelope";
import { incubatorStartupApiResponseSchema } from "@/models/api/startup";

export const dynamic = "force-dynamic";

export const GET = withApiV1<{ id: string }>(
  { scope: "startups:read" },
  async (req, { params, key }) => {
    // Parent resolu d'abord : 404 puis 403, avant toute pagination.
    const incubator = await getIncubatorByRef(toResourceRef(params.id));
    if (!incubator) {
      return problem("not_found", { instance: req.nextUrl.pathname });
    }
    if (!(await canAccessIncubator(key.read, incubator.uuid))) {
      return problem("out_of_perimeter", { instance: req.nextUrl.pathname });
    }

    const pagination = parsePagination(req.nextUrl.searchParams);
    if (!pagination.success) {
      return invalidRequest(pagination.error, {
        instance: req.nextUrl.pathname,
      });
    }
    const { limit, offset } = pagination.data;

    // Le filtre descend en SQL : applique en memoire, total serait le total non
    // filtre et une page pourrait revenir vide.
    const filters = {
      incubatorUuid: incubator.uuid,
      phases: parsePhaseFilter(req.nextUrl.searchParams.get("phase")),
    };

    const [total, rows] = await Promise.all([
      countApiStartups(key.read, filters),
      listApiStartups(key.read, filters, { limit, offset }),
    ]);

    return jsonCollection(
      incubatorStartupApiResponseSchema,
      rows.map((row) => ({
        uuid: row.uuid,
        ghid: row.ghid,
        name: row.name,
        pitch: row.pitch,
        phases: row.phases,
        current_phase: currentPhaseName(row.phases),
      })),
      { total, limit, offset, perimeter: key.readLabel },
    );
  },
);

export const POST = methodNotAllowed(["GET"]);
