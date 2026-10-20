import { parsePagination } from "@/lib/api/pagination";
import { invalidRequest, methodNotAllowed } from "@/lib/api/problem";
import { withApiV1 } from "@/lib/api/withApiV1";
import {
  countApiMembers,
  listApiMembers,
} from "@/lib/kysely/queries/apiMembers";
import { jsonCollection } from "@/models/api/envelope";
import { apiMemberSchema } from "@/models/api/member";

// Route de donnees live : a rendre a la demande, jamais a prerender au build.
export const dynamic = "force-dynamic";

export const GET = withApiV1({ scope: "members:read" }, async (req, ctx) => {
  const pagination = parsePagination(req.nextUrl.searchParams);
  if (!pagination.success) {
    return invalidRequest(pagination.error, { instance: req.nextUrl.pathname });
  }
  const { limit, offset } = pagination.data;

  const [total, rows] = await Promise.all([
    countApiMembers(ctx.key.read),
    listApiMembers(ctx.key.read, { limit, offset }),
  ]);

  return jsonCollection(apiMemberSchema, rows, {
    total,
    limit,
    offset,
    perimeter: ctx.key.readLabel,
  });
});

export const POST = methodNotAllowed(["GET"]);
