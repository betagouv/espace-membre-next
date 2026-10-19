import { isAfter, isBefore } from "date-fns";

import { toMemberRef } from "@/lib/api/identifier";
import { canAccessMember } from "@/lib/api/perimeter";
import { methodNotAllowed, problem } from "@/lib/api/problem";
import { withApiV1 } from "@/lib/api/withApiV1";
import { getAllIncubators } from "@/lib/kysely/queries/incubators";
import {
  getMemberApiMissions,
  getUserBasicInfo,
  getUserStartups,
} from "@/lib/kysely/queries/users";
import { isUserActive } from "@/lib/member.utils";
import { getAvatarUrl } from "@/lib/s3";
import { jsonItem } from "@/models/api/envelope";
import { memberDetailApiResponseSchema } from "@/models/api/member";
import { memberBaseInfoToModel } from "@/models/mapper";

export const dynamic = "force-dynamic";

export const GET = withApiV1<{ id: string }>(
  { scope: "members:read" },
  async (req, { params, key }) => {
    const dbUser = await getUserBasicInfo(toMemberRef(params.id));
    if (!dbUser) {
      return problem("not_found", { instance: req.nextUrl.pathname });
    }
    if (!(await canAccessMember(key.read, dbUser.uuid))) {
      return problem("out_of_perimeter", { instance: req.nextUrl.pathname });
    }

    const incubators = await getAllIncubators();
    // Projection sur incubatorRefSchema : uuid, ghid et titre suffisent a un
    // incubateur embarque.
    const findIncubator = (incubatorId: string | null) => {
      const raw = incubatorId
        ? incubators.find((incubator) => incubator.uuid === incubatorId)
        : undefined;
      return raw ? { uuid: raw.uuid, ghid: raw.ghid, title: raw.title } : null;
    };

    const member = memberBaseInfoToModel(dbUser);
    const avatar = await getAvatarUrl(dbUser.username);
    const isActive = isUserActive(member.missions);

    const teams = member.teams
      ? member.teams.map((team) => ({
          ...team,
          incubator: findIncubator(team.incubator_id),
        }))
      : null;

    const now = new Date();
    const startups = (await getUserStartups(dbUser.uuid)).map((startup) => ({
      ...startup,
      incubator: findIncubator(startup.incubator_id),
      incubators: (startup.incubator_ids ?? [])
        .map(findIncubator)
        .filter((incubator) => incubator !== null),
      isCurrent:
        isAfter(now, startup.start ?? 0) &&
        (!startup.end || isBefore(now, startup.end)),
    }));

    // Missions exposees avec les startups en { uuid, ghid }, coherentes avec les
    // routes de listing.
    const missions = await getMemberApiMissions(dbUser.uuid);

    return jsonItem(memberDetailApiResponseSchema, {
      ...member,
      missions,
      avatar: avatar ?? null,
      teams,
      startups,
      isActive,
    });
  },
);

export const POST = methodNotAllowed(["GET"]);
