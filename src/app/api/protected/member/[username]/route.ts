import { HttpStatusCode } from "axios";

import { getAllIncubators } from "@/lib/kysely/queries/incubators";
import { getUserBasicInfo, getUserStartups } from "@/lib/kysely/queries/users";
import { memberBaseInfoToModel } from "@/models/mapper";

export async function GET(
    _: Request,
    { params: { username } }: { params: { username: string } }
) {
    const dbUser = await getUserBasicInfo({ username });
    if (!dbUser) {
        return Response.json(
            { error: "No user found for this username" },
            { status: HttpStatusCode.NotFound }
        );
    }
    const incubators = await getAllIncubators();
    const startups = await getUserStartups(dbUser.uuid);
    const member = memberBaseInfoToModel(dbUser);
    return Response.json({
        ...member,
        teams: member.teams
            ? member.teams.map((team) => {
                  const incubator = incubators.find(
                      (incubator) => incubator.uuid === team.incubator_id
                  );
                  return {
                      ...team,
                      incubator_ghid: incubator?.ghid,
                  };
              })
            : member.teams,
        startups: startups.map((startup) => {
            const incubator = incubators.find(
                (incubator) => incubator.uuid === startup.incubator_id
            );
            return {
                ...startup,
                incubator_ghid: incubator?.ghid,
            };
        }),
    });
}
