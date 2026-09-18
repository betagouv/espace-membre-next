import { toResourceRef } from "@/lib/api/identifier";
import { parsePagination } from "@/lib/api/pagination";
import { canAccessStartup } from "@/lib/api/perimeter";
import {
  invalidRequest,
  methodNotAllowed,
  problem,
} from "@/lib/api/problem";
import { withApiV1 } from "@/lib/api/withApiV1";
import { getStartup } from "@/lib/kysely/queries";
import {
  countStartupMembers,
  getStartupMembers,
} from "@/lib/kysely/queries/startups";
import { jsonCollection } from "@/models/api/envelope";
import { apiMemberSchema } from "@/models/api/member";

export const dynamic = "force-dynamic";

export const GET = withApiV1<{ id: string }>(
  { scope: "members:read" },
  async (req, { params, key }) => {
    const startup = await getStartup(toResourceRef(params.id));
    if (!startup) {
      return problem("not_found", { instance: req.nextUrl.pathname });
    }
    if (!(await canAccessStartup(key.read, startup.uuid))) {
      return problem("out_of_perimeter", { instance: req.nextUrl.pathname });
    }

    const pagination = parsePagination(req.nextUrl.searchParams);
    if (!pagination.success) {
      return invalidRequest(pagination.error, {
        instance: req.nextUrl.pathname,
      });
    }
    const { limit, offset } = pagination.data;

    const [total, rows] = await Promise.all([
      countStartupMembers(startup.uuid),
      getStartupMembers(startup.uuid, { limit, offset }),
    ]);

    return jsonCollection(apiMemberSchema, rows, {
      total,
      limit,
      offset,
      perimeter: key.readLabel,
    });
  },
);

export const POST = methodNotAllowed(["GET"]);
