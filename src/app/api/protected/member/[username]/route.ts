import { HttpStatusCode } from "axios";
import { isBefore, isAfter } from "date-fns";

import { getAllIncubators } from "@/lib/kysely/queries/incubators";
import { getUserBasicInfo, getUserStartups } from "@/lib/kysely/queries/users";
import { getMattermostUserInfo } from "@/lib/mattermost";
import { getAvatarUrl } from "@/lib/s3";
import { memberBaseInfoToModel } from "@/models/mapper";
import { isUserActive } from "@/utils/member";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;
  const dbUser = await getUserBasicInfo({ username });
  if (!dbUser) {
    return Response.json(
      { error: "No user found for this username" },
      { status: HttpStatusCode.NotFound },
    );
  }
  const incubators = await getAllIncubators();
  const member = memberBaseInfoToModel(dbUser);
  const avatar = await getAvatarUrl(dbUser.username);
  const mattermost =
    (await getMattermostUserInfo(dbUser?.primary_email)) ?? null;
  const isActive = isUserActive(member.missions);

  const teams = member.teams
    ? member.teams.map((team) => {
        const incubator = incubators.find(
          (incubator) => incubator.uuid === team.incubator_id,
        );
        return {
          ...team,
          incubator: incubator ?? null,
        };
      })
    : null;

  const now = new Date();
  const startups = (await getUserStartups(dbUser.uuid)).map((startup) => {
    const incubator = incubators.find(
      (incubator) => incubator.uuid === startup.incubator_id,
    );
    return {
      ...startup,
      incubator: incubator ?? null,
      isCurrent:
        isAfter(now, startup.start ?? 0) &&
        isBefore(now, startup.end ?? Infinity),
    };
  });

  return Response.json({
    ...member,
    avatar: avatar ?? null,
    mattermost,
    teams,
    startups,
    isActive,
  });
}
