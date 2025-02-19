import { isAfter, isBefore } from "date-fns";
import { intersection } from "lodash";

import config from ".";
import { getAllIncubators } from "@/lib/kysely/queries/incubators";
import { getTeamsForUser } from "@/lib/kysely/queries/teams";
import { getUserStartups } from "@/lib/kysely/queries/users";
import { memberBaseInfoSchemaType } from "@/models/member";

export const getAdmin = () => {
    return config.ESPACE_MEMBRE_ADMIN;
};

// todo: make it simpler
export const isSessionUserIncubatorTeamAdminForUser = async ({
    user,
    sessionUserUuid,
    incubator_id,
}: {
    user: memberBaseInfoSchemaType;
    sessionUserUuid: string;
    incubator_id?: string;
}): Promise<boolean> => {
    const member = user;

    const incubators = await getAllIncubators();

    const teams = member.teams
        ? member.teams.map((team) => {
              const incubator = incubators.find(
                  (incubator) => incubator.uuid === team.incubator_id
              );
              return {
                  ...team,
                  incubator: incubator ?? null,
              };
          })
        : [];

    const now = new Date();
    const startups = (await getUserStartups(member.uuid)).map((startup) => {
        const incubator = incubators.find(
            (incubator) => incubator.uuid === startup.incubator_id
        );
        return {
            ...startup,
            incubator: incubator ?? null,
            isCurrent:
                isAfter(now, startup.start ?? 0) &&
                isBefore(now, startup.end ?? Infinity),
        };
    });
    const userIncubators = Array.from(
        new Set(
            [
                incubator_id,
                ...startups
                    .filter((startup) => startup.isCurrent && startup.incubator)
                    .map((startup) => startup.incubator?.uuid),
                ...teams
                    .filter((team) => team.incubator)
                    .map((team) => team.incubator?.uuid),
            ].filter((id) => !!id)
        )
    );
    const sessionUserIncubators = (await getTeamsForUser(sessionUserUuid)).map(
        (teams) => teams.incubator_id
    );
    return intersection(userIncubators, sessionUserIncubators).length > 0;
};
