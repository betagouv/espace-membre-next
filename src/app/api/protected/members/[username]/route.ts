import { HttpStatusCode } from "axios";
import { isAfter, isBefore } from "date-fns";

import { getAllIncubators } from "@/lib/kysely/queries/incubators";
import {
  getMemberApiMissions,
  getUserBasicInfo,
  getUserStartups,
} from "@/lib/kysely/queries/users";
import { isUserActive } from "@/lib/member.utils";
import { getAvatarUrl } from "@/lib/s3";
import { incubatorToModel, memberBaseInfoToModel } from "@/models/mapper";
import { memberDetailApiResponseSchema } from "@/models/api/member";

export async function GET(
  _: Request,
  { params: { username } }: { params: { username: string } },
) {
  const dbUser = await getUserBasicInfo({ username });
  if (!dbUser) {
    return Response.json(
      { error: "No user found for this username" },
      { status: HttpStatusCode.NotFound },
    );
  }

  const incubators = await getAllIncubators();
  const findIncubator = (incubatorId: string | null) => {
    const raw = incubatorId
      ? incubators.find((incubator) => incubator.uuid === incubatorId)
      : undefined;
    return raw ? incubatorToModel(raw) : null;
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
  // routes de listing (l'ancienne route depreciee renvoyait des uuid bruts).
  const missions = await getMemberApiMissions(dbUser.uuid);

  const body = memberDetailApiResponseSchema.parse({
    ...member,
    missions,
    avatar: avatar ?? null,
    teams,
    startups,
    isActive,
  });
  return Response.json(body);
}
