import { toResourceRef } from "@/lib/api/identifier";
import { parsePagination } from "@/lib/api/pagination";
import { canAccessIncubator } from "@/lib/api/perimeter";
import {
  invalidRequest,
  methodNotAllowed,
  problem,
} from "@/lib/api/problem";
import { withApiV1 } from "@/lib/api/withApiV1";
import {
  countIncubatorMembers,
  getIncubatorByRef,
  getIncubatorMembers,
} from "@/lib/kysely/queries/incubators";
import { jsonCollection } from "@/models/api/envelope";
import {
  IncubatorMemberAttachment,
  incubatorMemberSchema,
} from "@/models/api/member";

export const dynamic = "force-dynamic";

export const GET = withApiV1<{ id: string }>(
  { scope: "members:read" },
  async (req, { params, key }) => {
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

    // Par defaut on renvoie TOUS les rattaches, missions terminees comprises,
    // pour ne pas masquer les personnes qui viennent de partir. ?status=active
    // ne garde que les membres actifs, et le predicat descend en SQL.
    const status = req.nextUrl.searchParams.get("status");
    if (status !== null && status !== "active") {
      return problem("invalid_request", {
        instance: req.nextUrl.pathname,
        detail: "Le parametre status n'accepte que la valeur active.",
        extensions: {
          errors: [
            {
              pointer: "/status",
              code: "invalid_enum_value",
              detail: "Valeur acceptee : active.",
            },
          ],
        },
      });
    }
    // Le chemin designe l'incubateur, il ne dispense pas du perimetre de la
    // clef : une clef startup/S atteint bien les incubateurs de S, mais n'y
    // enumere que les membres de S.
    const filters = { activeOnly: status === "active", perimeter: key.read };

    const [total, rows] = await Promise.all([
      countIncubatorMembers(incubator.uuid, filters),
      getIncubatorMembers(incubator.uuid, filters, { limit, offset }),
    ]);

    return jsonCollection(
      incubatorMemberSchema,
      rows.map((row) => ({
        uuid: row.uuid,
        username: row.username,
        fullname: row.fullname,
        github: row.github,
        primary_email: row.primary_email,
        secondary_email: row.secondary_email,
        attachment:
          row.viaStartups && row.viaTeams
            ? IncubatorMemberAttachment.BOTH
            : row.viaStartups
              ? IncubatorMemberAttachment.STARTUPS
              : IncubatorMemberAttachment.TEAMS,
        teams: row.incubatorTeams
          .map((team) => team.ghid)
          .filter((teamGhid): teamGhid is string => !!teamGhid),
        missions: row.missions,
      })),
      { total, limit, offset, perimeter: key.readLabel },
    );
  },
);

export const POST = methodNotAllowed(["GET"]);
